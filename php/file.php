<?php
$input = json_decode(file_get_contents("php://input"), true);

foreach($input as $m) {
	//do something for each received message
}