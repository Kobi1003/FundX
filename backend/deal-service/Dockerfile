FROM python:3.12-slim

WORKDIR /app

COPY deal-service/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY shared /app/shared
COPY deal-service/app /app/app

ENV PORT=8004
EXPOSE 8004

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8004"]
