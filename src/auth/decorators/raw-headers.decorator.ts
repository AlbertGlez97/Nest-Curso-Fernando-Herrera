import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';

export const RawHeaders = createParamDecorator(
  (data, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const headers = req.headers;

    if (!headers) {
      throw new InternalServerErrorException('Headers not found in request');
    }

    if (data) {
      return headers[data];
    }

    return headers;
  },
);
