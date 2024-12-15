import numpy as np
import pickle
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)

CORS(app)

model = pickle.load(open('model.pkl', 'rb'))
scaler = pickle.load(open('scaler.pkl', 'rb'))

@app.route('/')
def home():
    return "Weather Prediction Model is running!"

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        temp_c = data['Temp_C']
        rel_hum = data['Rel_Hum']
        wind_speed = data['Wind_Speed_km_h']
        press_kpa = data['Press_kPa']

        input_data = np.array([[temp_c, rel_hum, wind_speed, press_kpa]])

        scaled_input_data = scaler.transform(input_data)

        prediction = model.predict(scaled_input_data)

        weather_condition = ['Clear', 'Cloudy', 'RAIN', 'SNOW'][prediction[0]]

        print(f"Prediction: {weather_condition} for", data) 

        return jsonify({'prediction': weather_condition})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 400
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
