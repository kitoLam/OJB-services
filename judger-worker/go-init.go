package main

import "fmt"

type User struct {
	name string
	age  int
}

func main() {
	// var tmp int
	// tmp = 1
	var user User
	user.age = 1
	fmt.Println(user.age)
	fmt.Println("Hi Minh")
}
