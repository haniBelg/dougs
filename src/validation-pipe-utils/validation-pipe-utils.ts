import { HttpException, ValidationError, ValidationPipe } from '@nestjs/common';

export function validationPipe(
  errorsToPayloadFn: (validationErrors?: ValidationError[]) => Record<string, any>,
  status = 400,
) {
  const exceptionFactory = (errors: ValidationError[]) =>
    new HttpException(errorsToPayloadFn(errors), status);
  return new ValidationPipe({
    transform: true, // This enables automatic transformation of input data
    whitelist: true, // This removes properties that are not part of the DTO
    forbidNonWhitelisted: true, // Throw an error if a non-whitelisted property is present
    exceptionFactory,
    validateCustomDecorators: true,
    stopAtFirstError: false,
    transformOptions: {
      enableImplicitConversion: true,
    },
  });
}

export function flattenValidationErrors(
  validationErrors: ValidationError[],
  parentPath = '',
): ({ property: string; constraints: string | any[] } | any)[] {
  const flattenedErrors = [];

  validationErrors.forEach((error) => {
    // Build the current path and replace .1. with [1]
    let currentPath = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;
    currentPath = currentPath
      .replace(/\.(\d+)\./g, '[$1].')
      .replace(/\.(\d+)$/, '[$1]'); // Convert .1. to [1]. and .1 to [1]

    if (error.constraints) {
      Object.values(error.constraints).forEach((constraint) => {
        // Try to parse the constraint if it's a JSON string
        try {
          const parsedConstraint = JSON.parse(constraint);
          flattenedErrors.push(parsedConstraint); // Add parsed JSON as a separate error object
        } catch {
          // If it's not a JSON string, relate it to the property
          const existingError = flattenedErrors.find(
            (err) => err.property === currentPath,
          );
          if (existingError) {
            // If there's already an error for this property, push the constraint to its array
            existingError.errors.push(constraint);
          } else {
            // Otherwise, create a new error object
            flattenedErrors.push({
              property: currentPath,
              errors: [constraint],
            });
          }
        }
      });
    }

    if (error.children && error.children.length > 0) {
      flattenedErrors.push(
        ...flattenValidationErrors(error.children, currentPath),
      );
    }
  });

  // After constructing all the errors, check for single constraint arrays
  return flattenedErrors.map((err) => {
    if (err.errors && err.errors.length === 1) {
      err.error = err.errors[0]; // Convert array with one element to a string
      err.errors = undefined;
    }
    return err;
  });
}
