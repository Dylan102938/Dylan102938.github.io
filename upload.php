<?php
    $dbhost = "localhost";
    $dbuser = "root";
    $dbpass = "Dylan@5188";
    $db = "barcode_scanner";

    $conn = new mysqli($dbhost, $dbuser, $dbpass,$db) or die("Connect failed: %s\n". $conn -> error);
    if ($_POST['name']) {
        $userid = 1;
        $prod_name = mysqli_real_escape_string($conn, $_POST['name']);
        $image = mysqli_real_escape_string($conn, $_POST['image']);
        $ingredients = mysqli_real_escape_string($conn, $_POST['ingredients']);
        $nutr_facts = mysqli_real_escape_string($conn, $_POST['nutrFacts']);
        $date = date('m-d-Y', strtotime('+1 year'));
        $exp_date = mysqli_real_escape_string($conn, $date);

        $sql = "INSERT INTO user_products (user_id, prod_name, image, ingredients, nutr_facts, exp_date) 
VALUES (".$userid.", '".$prod_name."', '".$image."', '".$ingredients."', '".$nutr_facts."', '"
            .$exp_date."')";

        if (mysqli_query($conn, $sql) === TRUE) {
            echo "New record created successfully";
        } else {
            echo "Error: " . $sql . "<br>" . $conn->error;
        }
    }

    $conn -> close();


?>