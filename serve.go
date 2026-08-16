package main

import (
	"fmt"
	"net/http"
)

func main() {
	fmt.Println("Сервер запущен: http://localhost:8000")
	http.ListenAndServe(":8000", http.FileServer(http.Dir("dist")))
}
