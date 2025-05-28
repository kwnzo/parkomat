from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager

db = SQLAlchemy()
login = LoginManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')

    db.init_app(app)
    login.init_app(app)
    login.login_view = 'auth.login'

    # Регистрация Blueprint после создания app
    from .routes import main, auth
    app.register_blueprint(main)
    app.register_blueprint(auth, url_prefix='/auth')

    # Создание таблиц
    with app.app_context():
        db.create_all()
        # Добавление тестовых данных (опционально)
        from .models import ParkingSpot, ParkingZone
        if not ParkingZone.query.first():
            zone = ParkingZone(name="Основная парковка", location="Главный вход")
            db.session.add(zone)
            db.session.commit()  # Фиксируем зону сначала!

                # Создаем тестовые места, только если их нет
            if not ParkingSpot.query.first():
                # Получаем созданную зону
                zone = ParkingZone.query.first()
                
                for i in range(1, 11):
                    spot = ParkingSpot(
                        number=f"A-{i}",
                        zone_id=zone.id,  # Теперь zone_id точно есть
                        is_available=True
                    )
                    db.session.add(spot)
                db.session.commit()
                
    from .admin import routes as admin_routes
    app.register_blueprint(admin_routes.admin_bp)

    return app
