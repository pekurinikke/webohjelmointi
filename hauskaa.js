function calculate() {
    // Get the values from the input fields
    var num1 = parseFloat(document.getElementById("num1").value);
    var num2 = parseFloat(document.getElementById("num2").value);   
  
    var operator = document.getElementById("operator").value;
  
    // Perform the calculation based on the operator   
  
    var result;
    switch (operator) {
      case '+':
        result = num1 + num2;
        break;
      case '-':
        result = num1 - num2;
        break;
      case '*':
        result = num1 * num2;
        break;
      case '/':
        result = num1 / num2;
        break;
      default:
        result = "Invalid operator";   
  
    }
  
    // Display the result in the output field
    document.getElementById("result").value = result;
  }