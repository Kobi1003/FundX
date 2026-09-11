FROM python:3.12-slim

WORKDIR /app

COPY ai-service/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY shared /app/shared
COPY ai-service/app /app/app

ENV PORT=8005
EXPOSE 8005

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8005"]
