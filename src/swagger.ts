import swaggerJsdoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "External Listings Scraper API",
      version: "1.0.0",
      description:
        "Internal scraper service for MyAuto, Copart, IAAI. Returns raw listing data.",
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Local",
      },
      {
        url: "https://your-lambda-url.amazonaws.com",
        description: "Production",
      },
    ],
  },
  apis: ["./src/routes/**/*.ts"],
});
