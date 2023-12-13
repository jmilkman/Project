import webbrowser
import time

def bubble_sort(data):
    n = len(data)
    for i in range(n):
        for j in range(0, n-i-1):
            if data[j] > data[j+1]:
                data[j], data[j+1] = data[j+1], data[j]
                # Send data to the webpage for visualization
                print(data)
                time.sleep(0.5)  # Adjust the delay as needed

# Example data
data_to_sort = [4, 2, 7, 1, 9, 3]

# Open the webpage in the default web browser
webbrowser.open('bubble_sort_visualization.html')

# Start the bubble sort algorithm
bubble_sort(data_to_sort)
