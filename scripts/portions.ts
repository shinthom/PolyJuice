// 1. check balance (BAYC)
const num = await bayc.balanceOf(lender.address);

// 2. if balance > 0, get token of owner by index
for (let i = 0; i < num; i++) {
  const token = await bayc.tokenOfOwnerByIndex(account.address, i);
  console.log(token);
}

// 3. show child erc721s
const child = await api.getChild(BAYCs.address, 0).data.child
if (child.expiredAt > 0) {
  console.log("rented: " + child.duration + ", " + child.amount);
} else {
  
}
