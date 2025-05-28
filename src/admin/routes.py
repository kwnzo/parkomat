from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_required, current_user
from ..models import ParkingSpot, User, db, ParkingZone

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

@admin_bp.before_request
@login_required
def check_admin():
    if not current_user.is_admin:
        return redirect(url_for('main.index'))

@admin_bp.route('/dashboard')
def dashboard():
    spots = ParkingSpot.query.all()
    users = User.query.all()
    return render_template('admin/dashboard.html', spots=spots, users=users)

@admin_bp.route('/toggle_spot/<int:spot_id>')
def toggle_spot(spot_id):
    spot = ParkingSpot.query.get_or_404(spot_id)
    spot.is_available = not spot.is_available
    db.session.commit()
    return redirect(url_for('admin.dashboard'))

@admin_bp.route('/zones')
def zones():
    zones = ParkingZone.query.all()
    return render_template('admin/zones.html', zones=zones)

@admin_bp.route('/add_zone', methods=['GET', 'POST'])
def add_zone():
    if request.method == 'POST':
        name = request.form.get('name')
        location = request.form.get('location')
        
        zone = ParkingZone(name=name, location=location)
        db.session.add(zone)
        db.session.commit()
        
        flash('Зона успешно добавлена', 'success')
        return redirect(url_for('admin.zones'))
    
    return render_template('admin/add_zone.html')

@admin_bp.route('/delete_zone/<int:zone_id>')
def delete_zone(zone_id):
    zone = ParkingZone.query.get_or_404(zone_id)
    db.session.delete(zone)
    db.session.commit()
    flash('Зона удалена', 'success')
    return redirect(url_for('admin.zones'))

@admin_bp.route('/spots')
def spots():
    zones = ParkingZone.query.all()
    selected_zone = request.args.get('zone', type=int)
    spots = ParkingSpot.query.filter_by(zone_id=selected_zone).all() if selected_zone else []
    return render_template('admin/spots.html', zones=zones, selected_zone=selected_zone, spots=spots)

@admin_bp.route('/add_spot', methods=['GET', 'POST'])
def add_spot():
    if request.method == 'POST':
        number = request.form.get('number')
        zone_id = request.form.get('zone_id')
        is_available = True if request.form.get('is_available') else False

        # Проверка на уникальность номера в зоне
        existing_spot = ParkingSpot.query.filter_by(number=number, zone_id=zone_id).first()
        if existing_spot:
            flash('Место с таким номером уже существует в этой зоне', 'danger')
            return redirect(url_for('admin.add_spot'))

        spot = ParkingSpot(
            number=number,
            zone_id=zone_id,
            is_available=is_available
        )
        db.session.add(spot)
        db.session.commit()
        flash('Место успешно добавлено', 'success')
        return redirect(url_for('admin.spots'))

    zones = ParkingZone.query.all()
    return render_template('admin/add_spot.html', zones=zones)