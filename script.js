let chart;

function analyzeBudget(){
const income=Number(document.getElementById('income').value);
const food=Number(document.getElementById('food').value);
const travel=Number(document.getElementById('travel').value);
const shopping=Number(document.getElementById('shopping').value);
const entertainment=Number(document.getElementById('entertainment').value);

const expense=food+travel+shopping+entertainment;
const savings=income-expense;

document.getElementById('totalIncome').innerText='₹'+income;
document.getElementById('totalExpense').innerText='₹'+expense;
document.getElementById('savings').innerText='₹'+savings;

let msg='Good budgeting habit.';
if(expense>income){
 msg='⚠️ Budget exceeded. Reduce unnecessary spending.';
}else if(shopping>income*0.3){
 msg='🛍️ Shopping expense is high. Try saving more.';
}else if(savings>income*0.3){
 msg='✅ Excellent! You are saving more than 30%.';
}

document.getElementById('result').innerText=msg;

localStorage.setItem('financeData',JSON.stringify({income,food,travel,shopping,entertainment}));

const ctx=document.getElementById('expenseChart');
if(chart) chart.destroy();

chart=new Chart(ctx,{
 type:'pie',
 data:{
  labels:['Food','Travel','Shopping','Entertainment'],
  datasets:[{data:[food,travel,shopping,entertainment]}]
 }
});
}

window.onload=()=>{
const data=JSON.parse(localStorage.getItem('financeData'));
if(!data) return;
for(const k in data){
 const el=document.getElementById(k);
 if(el) el.value=data[k];
}
};
