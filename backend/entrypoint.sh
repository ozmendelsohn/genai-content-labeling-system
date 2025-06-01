#!/bin/sh
set -e

# Activate Poetry virtual environment
# Poetry typically creates venvs in /root/.cache/pypoetry/virtualenvs
# We need to find the correct one. A common way is to use `poetry shell` to activate
# or find the path. Alternatively, `poetry run` should handle this.

# Get the venv path from poetry itself and activate it
. $(poetry env info --path)/bin/activate

# Execute the uvicorn command.
# Since PYTHONPATH includes /app/src and main.py is in /app/src,
# uvicorn should find main.py directly.
# The WORKDIR is /app.
exec python -m uvicorn main:app --host 0.0.0.0 --port 8000 