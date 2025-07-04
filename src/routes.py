from flask import render_template, redirect, url_for, flash, Blueprint, request, send_file
from flask_login import login_user, logout_user, login_required, current_user
from .models import User, ParkingSpot, Reservation, ParkingZone
from .forms import RegistrationForm, LoginForm
from . import db, login # type: ignore
from datetime import datetime
import os

ZONE_FOLDER = os.path.join('static', 'photos')

main = Blueprint('main', __name__)
auth = Blueprint('auth', __name__)

@main.route('/', methods=['GET'])
def index():
    zones = ParkingZone.query.all()
    selected_zone = request.args.get('zone', default=1, type=int)
    spots = ParkingSpot.query.filter_by(zone_id=selected_zone).all()
    return render_template('index.html', zones=zones, spots=spots, selected_zone=selected_zone)


@main.route('/parkings', methods = ['GET'])
def show_zones():
    actual_zone1 = os.path.join('static', 'photos', 'parking_zone_one.jpg')
    actual_zone2 = os.path.join('static', 'photos', 'parking_zone_two.jpg')
    actual_zone3 = os.path.join('static', 'photos', 'parking_zone_three.jpg')
    return render_template('zones.html', parking_zone1 = actual_zone1,
                           parking_zone2 = actual_zone2, parking_zone3 = actual_zone3)

@auth.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user and user.check_password(form.password.data):
            login_user(user, remember=form.remember_me.data)
            return redirect(url_for('main.index'))  # Исправлено
        flash('Неверный email или пароль')
    return render_template('login.html', form=form)

@auth.route('/register', methods=['GET', 'POST'])
def register():
    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(
            username=form.username.data,
            email=form.email.data
        ) # type: ignore
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        flash('Регистрация успешна!', 'success')
        return redirect(url_for('auth.login'))
    return render_template('register.html', form=form)

@main.route("/reserve/<int:spot_id>", methods=["POST"])
@login_required
def reserve(spot_id):
    spot = ParkingSpot.query.get_or_404(spot_id)
    current_zone = request.args.get("zone", type=int)

    if not spot.is_available:
        flash("Место уже занято", "danger")
        return redirect(url_for("main.index", zone=current_zone))

    # Получаем start_time и end_time из формы
    try:
        start_time_str = request.form.get("start_time")
        end_time_str = request.form.get("end_time")
        start_time = datetime.fromisoformat(start_time_str)
        end_time = datetime.fromisoformat(end_time_str)

        if end_time <= start_time:
            flash("Время окончания должно быть позже начала", "warning")
            return redirect(url_for("main.index", zone=current_zone))

    except Exception as e:
        flash("Ошибка в формате даты/времени", "danger")
        return redirect(url_for("main.index", zone=current_zone))

    # Создаём бронь
    reservation = Reservation(
        user_id=current_user.id,
        spot_id=spot.id,
        start_time=start_time,
        end_time=end_time
    )
    spot.is_available = False
    db.session.add(reservation)
    db.session.commit()

    flash("Место успешно забронировано!", "success")
    return redirect(url_for("main.index", zone=current_zone))

@main.route('/dashboard')
@login_required
def dashboard():
    reservations = current_user.reservations
    return render_template('dashboard.html', reservations=reservations)

@main.errorhandler(404)
def error(error):
    return render_template('404.html'), 404  # Новый шаблон

@auth.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Вы успешно вышли из системы.', 'success')
    return redirect(url_for('main.index'))
