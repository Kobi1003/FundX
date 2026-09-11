FROM python:3.12-slim

WORKDIR /app

COPY startup-service/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY shared /app/shared
COPY startup-service/app /app/app

ENV PORT=8002
EXPOSE 8002

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002"]
