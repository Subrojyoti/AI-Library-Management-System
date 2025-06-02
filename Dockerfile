FROM python:3.10-slim

# Set working directory inside the container
WORKDIR /code

# Install dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend code
COPY backend ./backend

# Expose the port FastAPI will run on
EXPOSE 8000

# Start the FastAPI server with the correct import path
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
