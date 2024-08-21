import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { flattenValidationErrors, validationPipe } from '../validation-pipe-utils/validation-pipe-utils';
import { ValidationRequestDto } from './movements-validation.dtos';
@Controller('movements')
export class ValidationController {
  @Post('/validation')
  public post(
    @Body(
      validationPipe(
        (errors) => ({
          message: 'I’m a teapot',
          reasons: flattenValidationErrors(errors),
        }),
        418,
      ),
    )
    body: ValidationRequestDto,
    @Res() res: Response,
  ) {
    res.status(202).json({ message: 'accepted' });
  }
}
