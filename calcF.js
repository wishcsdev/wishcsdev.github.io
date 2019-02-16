const setUp = {
  displayValue: '0',
  firstOperand: null,
  waitingForSecondOperand: false,
  operator: null,
};
function evaluate() {
  const display = document.querySelector('.display');
  display.value = setUp.displayValue;
}
evaluate();

  function clickMe(val){document.form.display.value=document.form.display.value+val;}
  function clickDel(){document.form.display.value="";}
  //https://stackoverflow.com/questions/30849912/backspace-on-calculator-using-javascript//
  function backSpace(){
  	let value=document.getElementById("disp").value;
	document.getElementById("disp").value=value.substring(0,value.length-1);
  }
  
  function inputDuplicate(val) {
  let counter=0;
  if (counter==0 && !document.form.display.value.includes(val)) {
    document.form.display.value=document.form.display.value+val;
	counter++;
  }
  else{
	  document.form.display.disable=true;
	  
  }
}
 function clickEqual(){document.form.display.value=eval(document.form.display.value);}
