window.onload=()=>{
const data=JSON.parse(localStorage.getItem('financeData'));
if(!data) return;

for(const k in data){
 const el=document.getElementById(k);
 if(el) el.value=data[k];
}

analyzeBudget();
}

// 👇 INGA KEELA ADD PANNU
async function getAISuggestion() {

 const income=document.getElementById('income').value;
 const food=document.getElementById('food').value;
 const travel=document.getElementById('travel').value;
 const shopping=document.getElementById('shopping').value;
 const entertainment=document.getElementById('entertainment').value;

 const totalExpense=
 Number(food)+
 Number(travel)+
 Number(shopping)+
 Number(entertainment);

 const prompt=`
 Income: ₹${income}
 Expense: ₹${totalExpense}

 Give budgeting advice for a college student.
 `;

 try{

 document.getElementById('result').innerHTML =
 "🤖 AI is analyzing your budget...";

 const response=await fetch(
 "https://apidev.navigatelabsai.com/v1/chat/completions",
 {
  method:"POST",
  headers:{
   "Content-Type":"application/json",
   "Authorization":"Bearer sk-Q2mK7JBcGPLoGON47j__4A"
  },
  body:JSON.stringify({
   model:"gpt-4o-mini",
   messages:[
    {
     role:"user",
     content:prompt
    }
   ]
  })
 });

 const data=await response.json();

 document.getElementById('result').innerHTML=
 data.choices[0].message.content;

 }
 catch(error){

 document.getElementById('result').innerHTML=
 "❌ AI service unavailable.";

 console.error(error);

 }
}
