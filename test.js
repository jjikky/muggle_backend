console.log("=== START !");
datas = [1, 2, 3, 4, 5];
var size = "";

setTimeout(() => {
  //의외로 [1, 2, 3, 4, 5] 가 나오지 않는다.
  console.log("===== Amazing : " + datas);
}, 3000);

printAll();

/* 
    아래에서 번외로, printAll 에서 async 와 await 를 삭제하면 재미있는 일이 일어난다.
    pushAsync 5개를 한꺼번에 실행하고 setTimeout 이 한꺼번에 등록되면서, 
    1초가 지난 후 연속적으로 5개가 실행 된다.
*/
async function printAll() {
  for (var i = 0; i < 5; i++) {
    // for 안에서 비동기 함수가 동작할 것이다.
    await pushAsync(i); //promise 를 리턴해야 await 로 사용 가능 하다.
  }
  console.log("=== END ? : " + datas);
}

function pushAsync(i) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Add " + (6 + i) + " to Array.");
      datas.push(6 + i);
      resolve(datas);
    }, 1000);
  });
}

console.log("=== Not amazing : " + datas);
