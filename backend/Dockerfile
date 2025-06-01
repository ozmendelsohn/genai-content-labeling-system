# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Set the working directory in the container
WORKDIR /app

# Add src to PYTHONPATH
ENV PYTHONPATH="/app/src:${PYTHONPATH}"

# Create a non-root user early
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Install Poetry
RUN pip install poetry

# Configure Poetry to not create virtual environment (use system Python)
RUN poetry config virtualenvs.create false

# Copy only poetry files first to leverage Docker cache for dependencies
COPY poetry.lock pyproject.toml ./

# Install project dependencies
RUN poetry install --no-root

# Copy the rest of the backend application code, including the src directory
COPY . .

# Create necessary directories and set proper ownership
RUN mkdir -p /app/data /app/uploads /app/logs && \
    chown -R appuser:appuser /app

# Copy and make the entrypoint script executable
RUN chmod +x entrypoint.sh

# Switch to non-root user
USER appuser

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Define environment variables with defaults
ENV APP_MODULE="main:app"
ENV HOST="0.0.0.0"
ENV PORT="8000"
ENV PYTHONPATH="/app/src"
ENV DATABASE_URL="sqlite:///./data/genai_labeling.db"

# Set the entrypoint
ENTRYPOINT ["./entrypoint.sh"] 