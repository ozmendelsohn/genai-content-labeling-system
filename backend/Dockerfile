# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Set the working directory in the container
WORKDIR /app

# Add src to PYTHONPATH
ENV PYTHONPATH="/app/src:${PYTHONPATH}"

# Install Poetry
RUN pip install poetry

# Copy only poetry files first to leverage Docker cache for dependencies
COPY poetry.lock pyproject.toml ./

# Install project dependencies
RUN poetry install --no-root

# Copy the rest of the backend application code, including the src directory
COPY . .
# Specifically, entrypoint.sh and the src directory with your Python files

# Copy and make the entrypoint script executable
# entrypoint.sh is expected to be in the root of the backend directory (copied by COPY . .)
RUN chmod +x entrypoint.sh

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Define environment variable (optional, but good practice)
# These are now less critical as entrypoint.sh hardcodes the command,
# but could be used by the app itself.
ENV APP_MODULE="main:app"
ENV HOST="0.0.0.0"
ENV PORT="8000"

# Set the entrypoint
ENTRYPOINT ["./entrypoint.sh"]
# CMD is now implicitly what the entrypoint executes, or can be parameters to entrypoint if it was designed for that. 