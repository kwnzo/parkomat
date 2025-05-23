from flask import Flask, render_template, redirect, session, Response, abort, request
import asyncio
import logging
from flask_limiter import Limiter


loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)
logger = logging.getLogger(__name__ )
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
app = Flask(__name__, static_folder='static')
app.secret_key = 'ajhaSDHJASHJDAJHSDjnbnm'

@app.route('/index')
def index():
    return render_template('admin.html')

@app.route('/')
def landing():
    if request.method == 'GET':
        return render_template('index.html')


def run_server():
    try:
        logging.info('Starting Flask server...')
        # Запускаем Flask сервер в режиме разработки
        app.run(
            host='0.0.0.0',
            port=5000,
            debug=True,
            use_reloader=True
        )
    except Exception as e:
        logging.error(f'Server error: {e}')
    finally:
        logging.info('Server stopped')

if __name__ == '__main__':
    run_server()
