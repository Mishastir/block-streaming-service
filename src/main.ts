import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module";

import { ConfigService } from "@config";

async function bootstrap(): Promise<void> {
  const config = new ConfigService();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });

  app.enableCors({ origin: "*" });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle("DocBuilder-Backend API")
    .setVersion("1.0.0")
    .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT", in: "Header" }, "Auth")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup("docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  app.enableShutdownHooks();

  const port = config.app.port;

  await app.listen(port)
    .then(() => {
      Logger.log(`Server(${config.app.env}) initialized on port ${port}`, "NestApplication");
    });
}

bootstrap();
