import os
from dotenv import load_dotenv

load_dotenv()
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
app = Flask(__name__)

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [
                "http://localhost:5173",
                "http://127.0.0.1:5173"
            ]
        }
    }
)


# ---------------------------------
# MYSQL DATABASE CONNECTION
# ---------------------------------

def get_connection():
    return mysql.connector.connect(
    host=os.getenv("DB_HOST"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    database=os.getenv("DB_NAME")
)


# ---------------------------------
# HOME ROUTE
# ---------------------------------

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "StayFinder Backend is Running!"
    })


# ---------------------------------
# GET AVAILABLE AREAS
# ---------------------------------

@app.route("/api/areas", methods=["GET"])
def get_areas():
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            "SELECT DISTINCT area FROM pgs ORDER BY area"
        )

        areas = [row[0] for row in cursor.fetchall()]

        return jsonify({"areas": areas}), 200

    except Error as error:
        print("AREA ERROR:", error)
        return jsonify({"error": "Unable to load areas"}), 500

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


# ---------------------------------
# SEARCH PGs BY AREA AND GENDER
# ---------------------------------

@app.route("/api/pgs", methods=["GET"])
def get_pgs():
    connection = None
    cursor = None

    try:
        area = request.args.get("area", "").strip()
        gender = request.args.get("gender", "").strip()

        if not area or not gender:
            return jsonify({
                "error": "Area and gender are required"
            }), 400

        if gender.lower() not in ["men", "women"]:
            return jsonify({
                "error": "Gender must be Men or Women"
            }), 400

        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        query = """
            SELECT
                id,
                name,
                area,
                gender,
                rent,
                facilities,
                image,
                room_type,
                description
            FROM pgs
            WHERE LOWER(area) = LOWER(%s)
              AND LOWER(gender) = LOWER(%s)
            ORDER BY id
        """

        cursor.execute(query, (area, gender))
        pgs = cursor.fetchall()

        # Convert database values to JSON-friendly values.
        # Add a rooms array so React can use sharing prices.
        for pg in pgs:
            pg["rent"] = float(pg["rent"]) if pg["rent"] is not None else 0
            pg["rooms"] = []

            # Use room_type from the existing pgs table as a fallback.
            pg["room_type"] = pg.get("room_type") or "Double"

        return jsonify({"pgs": pgs}), 200

    except Error as error:
        print("PG SEARCH DATABASE ERROR:", error)
        return jsonify({
            "error": "Unable to load PGs"
        }), 500

    except Exception as error:
        print("PG SEARCH ERROR:", error)
        return jsonify({
            "error": "Unexpected error while loading PGs"
        }), 500

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


# ---------------------------------
# SAVE VISITOR ENQUIRY
# Uses your existing users and bookings tables.
# ---------------------------------

@app.route("/api/visitors", methods=["POST"])
def save_visitor():
    connection = None
    cursor = None

    try:
        data = request.get_json(silent=True) or {}

        name = str(data.get("name", "")).strip()
        age = data.get("age")
        phone = str(data.get("phone", "")).strip()
        email = str(data.get("email", "")).strip()

        pg_id = data.get("pg_id")
        message = (
            f"Area: {data.get('area', '')}; "
            f"Gender: {data.get('gender', '')}; "
            f"PG: {data.get('pg_name', '')}; "
            f"Sharing: {data.get('sharing_type', '')}; "
            f"Rent: {data.get('rent', '')}"
        )

        if not name or not phone or age is None:
            return jsonify({
                "error": "Name, age, and phone are required"
            }), 400

        try:
            age = int(age)
            pg_id = int(pg_id)
        except (TypeError, ValueError):
            return jsonify({
                "error": "Age and PG ID must be valid numbers"
            }), 400

        if age < 18 or age > 100:
            return jsonify({
                "error": "Age must be between 18 and 100"
            }), 400

        connection = get_connection()
        cursor = connection.cursor()

        # Save visitor details in users table.
        cursor.execute(
            """
            INSERT INTO users (name, age, phone, email)
            VALUES (%s, %s, %s, %s)
            """,
            (name, age, phone, email or None)
        )

        user_id = cursor.lastrowid

        # Confirm that the selected PG exists.
        cursor.execute(
            "SELECT id FROM pgs WHERE id = %s",
            (pg_id,)
        )

        if cursor.fetchone() is None:
            connection.rollback()
            return jsonify({
                "error": "Selected PG does not exist"
            }), 404

        # Save enquiry as a booking.
        cursor.execute(
            """
            INSERT INTO bookings (pg_id, user_id, message, status)
            VALUES (%s, %s, %s, %s)
            """,
            (pg_id, user_id, message, "Pending")
        )

        booking_id = cursor.lastrowid
        connection.commit()

        return jsonify({
            "message": "Enquiry saved successfully",
            "user_id": user_id,
            "booking_id": booking_id
        }), 201

    except Error as error:
        if connection and connection.is_connected():
            connection.rollback()

        print("VISITOR DATABASE ERROR:", error)
        return jsonify({
            "error": "Unable to save visitor enquiry"
        }), 500

    except Exception as error:
        if connection and connection.is_connected():
            connection.rollback()

        print("VISITOR ERROR:", error)
        return jsonify({
            "error": "Unexpected error while saving enquiry"
        }), 500

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


# ---------------------------------
# TEST MYSQL CONNECTION
# ---------------------------------

@app.route("/api/test-db", methods=["GET"])
def test_db():
    connection = None

    try:
        connection = get_connection()

        if connection.is_connected():
            return jsonify({
                "message": "MySQL connected successfully"
            }), 200

    except Error as error:
        print("MYSQL CONNECTION ERROR:", error)
        return jsonify({
            "error": str(error)
        }), 500

    finally:
        if connection and connection.is_connected():
            connection.close()


# ---------------------------------
# START FLASK SERVER
# ---------------------------------

if __name__ == "__main__":
    app.run(debug=True, port=5000)
