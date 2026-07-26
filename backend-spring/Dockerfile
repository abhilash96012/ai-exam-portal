# Stage 1: Build stage using Maven and Java 17
FROM maven:3.9-eclipse-temurin-17-alpine AS build

WORKDIR /app

# Copy pom.xml and source code
COPY pom.xml ./
COPY src ./src

# Package application JAR file skipping tests for speed
RUN mvn clean package -DskipTests

# Stage 2: Runtime stage
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy built JAR from Stage 1
COPY --from=build /app/target/*.jar app.jar

EXPOSE 5000

ENV PORT=5000
ENV OLLAMA_API_URL=http://ollama:11434/api/generate
ENV OLLAMA_MODEL=llama3:latest

CMD ["java", "-jar", "app.jar"]
