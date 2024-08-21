import { HttpException, ValidationError, ValidationPipe } from '@nestjs/common';
import { flattenValidationErrors, validationPipe } from './validation-pipe-utils'; // Adjust the import based on your file structure

describe('validation-pipe-utils', () => {
  describe('validation function', () => {
    const mockErrorsToPayloadFn = jest.fn((errors?: ValidationError[]) => {
      return { errors };
    });

    it('should return a ValidationPipe', () => {
      const validationPipeInstance = validationPipe(mockErrorsToPayloadFn);
      expect(validationPipeInstance).toBeInstanceOf(ValidationPipe);
    });

    it('should use the provided errorToPayload function and status in the exceptionFactory', () => {
      const validationPipeInstance: ValidationPipe = validationPipe(
        mockErrorsToPayloadFn,
        422,
      );
      const exceptionFactory = (validationPipeInstance as any).exceptionFactory;

      const mockErrors = [
        {
          property: 'field',
          constraints: { isString: 'field must be a string' },
        },
      ] as ValidationError[];

      try {
        exceptionFactory(mockErrors);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(422);
        expect(mockErrorsToPayloadFn).toHaveBeenCalledWith(mockErrors);
      }
    });

    it('should default to status 400 when not provided', () => {
      const validationPipeInstance: ValidationPipe = validationPipe(mockErrorsToPayloadFn);
      const exceptionFactory = (validationPipeInstance as any).exceptionFactory;

      const mockErrors = [
        {
          property: 'field',
          constraints: { isString: 'field must be a string' },
        },
      ] as ValidationError[];

      try {
        exceptionFactory(mockErrors);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(400);
        expect(mockErrorsToPayloadFn).toHaveBeenCalledWith(mockErrors);
      }
    });
  });

  describe('flattenValidationErrors function', () => {
    it('should flatten validation errors with simple constraints', () => {
      const mockErrors: ValidationError[] = [
        {
          property: 'name',
          constraints: { isString: 'name must be a string' },
          children: [],
        },
      ];

      const result = flattenValidationErrors(mockErrors);
      expect(result).toEqual([
        { property: 'name', error: 'name must be a string' },
      ]);
    });

    it('should flatten validation errors with nested children', () => {
      const mockErrors: ValidationError[] = [
        {
          property: 'user',
          children: [
            {
              property: 'email',
              constraints: { isEmail: 'email must be a valid email' },
              children: [],
            },
          ],
        },
      ];

      const result = flattenValidationErrors(mockErrors);
      expect(result).toEqual([
        { property: 'user.email', error: 'email must be a valid email' },
      ]);
    });

    it('should handle array notation for nested properties', () => {
      const mockErrors: ValidationError[] = [
        {
          property: 'users',
          children: [
            {
              property: '0',
              children: [
                {
                  property: 'email',
                  constraints: { isEmail: 'email must be a valid email' },
                  children: [],
                },
              ],
            },
          ],
        },
      ];

      const result = flattenValidationErrors(mockErrors);
      expect(result).toEqual([
        { property: 'users[0].email', error: 'email must be a valid email' },
      ]);
    });

    it('should parse JSON constraint strings', () => {
      const mockErrors: ValidationError[] = [
        {
          property: 'data',
          constraints: { customError: '{"error": "Invalid data"}' },
          children: [],
        },
      ];

      const result = flattenValidationErrors(mockErrors);
      expect(result).toEqual([{ error: 'Invalid data' }]);
    });

    it('should ignore invalid JSON constraint strings', () => {
      const mockErrors: ValidationError[] = [
        {
          property: 'name',
          constraints: { customError: 'invalid json string' },
          children: [],
        },
      ];

      const result = flattenValidationErrors(mockErrors);
      expect(result).toEqual([
        { property: 'name', error: 'invalid json string' },
      ]);
    });

    it('should not break if children are missing', () => {
      const mockErrors: ValidationError[] = [
        {
          property: 'fieldWithoutChildren',
          constraints: { isString: 'field must be a string' },
        } as ValidationError,
      ];

      const result = flattenValidationErrors(mockErrors);
      expect(result).toEqual([
        { property: 'fieldWithoutChildren', error: 'field must be a string' },
      ]);
    });
  });
});
