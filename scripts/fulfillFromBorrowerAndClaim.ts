import { ethers } from "hardhat";
import { makeBidding, fixture, increaseTime } from "./utils";

async function main() {
  const { contracts, users } = await fixture();

  const { polyJuice, childERC721, erc20 } = contracts;
  const { lender, borrower } = users;

  const rentalPeriod = 86400; // 1 day
  const biddingPeriod = 86400; // 1 day

  console.log(
    "\nstarting making bidding (from lender) ⬇️\n===================================================================================================================================="
  );
  const biddingFromLender = await makeBidding(lender, {
    lender: lender.address,
    borrower: ethers.constants.AddressZero,
    erc721: childERC721.address,
    tokenId: 0,
    erc20: erc20.address,
    amount: 100,
    listingExpiration: Math.floor(Date.now() / 1000) + biddingPeriod, // + 1 day
    biddingExpiration: 0,
    duration: rentalPeriod, // 1 day
  });
  console.log(biddingFromLender);

  console.log(
    "\nstarting fulfillment (from borrower) ⬇️\n===================================================================================================================================="
  );

  console.log(
    `before:
- erc20(PolyJuice): ${await contracts.erc20.balanceOf(polyJuice.address)}
- erc721(lender)  : ${await contracts.childERC721.balanceOf(lender.address)}
- erc721(borrower): ${await contracts.childERC721.balanceOf(borrower.address)}
- erc20(lender)   : ${await contracts.erc20.balanceOf(lender.address)}
- erc20(borrower) : ${await contracts.erc20.balanceOf(borrower.address)} \n`
  );

  await polyJuice
    .connect(borrower)
    .fulfill(
      biddingFromLender.lender,
      biddingFromLender.borrower,
      biddingFromLender.erc721,
      biddingFromLender.tokenId,
      biddingFromLender.erc20,
      biddingFromLender.amount,
      biddingFromLender.listingExpiration,
      biddingFromLender.biddingExpiration,
      biddingFromLender.duration,
      biddingFromLender.signature
    );

  console.log(
    `after:
- erc20(PolyJuice): ${await contracts.erc20.balanceOf(polyJuice.address)}
- erc721(lender)  : ${await contracts.childERC721.balanceOf(lender.address)}
- erc721(borrower): ${await contracts.childERC721.balanceOf(borrower.address)}
- erc20(lender)   : ${await contracts.erc20.balanceOf(lender.address)}
- erc20(borrower) : ${await contracts.erc20.balanceOf(borrower.address)} \n`
  );

  const id = await polyJuice.id(
    biddingFromLender.lender,
    borrower.address,
    biddingFromLender.erc721,
    biddingFromLender.tokenId,
    biddingFromLender.erc20,
    biddingFromLender.amount,
    biddingFromLender.duration
  );
  console.log(`created id: ${id}`);
  console.log(await polyJuice.biddings(id));

  await increaseTime(rentalPeriod);

  console.log(
    "\nstarting claim (from lender) ⬇️\n===================================================================================================================================="
  );

  console.log(
    `before:
- erc20(PolyJuice): ${await contracts.erc20.balanceOf(polyJuice.address)}
- erc721(lender)  : ${await contracts.childERC721.balanceOf(lender.address)}
- erc721(borrower): ${await contracts.childERC721.balanceOf(borrower.address)}
- erc20(lender)   : ${await contracts.erc20.balanceOf(lender.address)}
- erc20(borrower) : ${await contracts.erc20.balanceOf(borrower.address)} \n`
  );

  await childERC721.connect(lender).claim(id);

  console.log(
    `after:
- erc20(PolyJuice): ${await contracts.erc20.balanceOf(polyJuice.address)}
- erc721(lender)  : ${await contracts.childERC721.balanceOf(lender.address)}
- erc721(borrower): ${await contracts.childERC721.balanceOf(borrower.address)}
- erc20(lender)   : ${await contracts.erc20.balanceOf(lender.address)}
- erc20(borrower) : ${await contracts.erc20.balanceOf(borrower.address)} \n`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
