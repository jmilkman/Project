from flask import Flask, render_template
import sse
import time
import threading

app = Flask(__name__)
app.config["REDIS_URL"] = "redis://localhost"  # You need to have a Redis server running for Flask-SSE

app.register_blueprint(sse, url_prefix='/stream')

@app.route('/')
def index():
    return render_template('bubble_sort_visualization.html')

def bubble_sort(data):
    n = len(data)
    for i in range(n):
        for j in range(0, n-i-1):
            if data[j] > data[j+1]:
                data[j], data[j+1] = data[j+1], data[j]
                # Send data to the webpage for visualization
                with app.app_context():
                    sse.publish({"data": data}, type='update')
                time.sleep(0.5)  # Adjust the delay as needed

@app.route('/start_sorting')
def start_sorting():
    thread = threading.Thread(target=bubble_sort, args=([4, 2, 7, 1, 9, 3, 10],))
    thread.start()
    return "Sorting started"

if __name__ == '__main__':
    app.run(debug=True)
