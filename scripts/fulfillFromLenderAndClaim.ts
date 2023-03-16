import { ethers } from "hardhat";
import { makeBidding, fixture, increaseTime } from "./utils";

async function main() {
  const { contracts, users } = await fixture();

  const { polyJuice, childERC721, erc20 } = contracts;
  const { lender, borrower } = users;

  const rentalPeriod = 86400; // 1 day
  const listingPeriod = 86400; // 1 day

  console.log(
    "\nstarting making bidding (from lender) ⬇️\n===================================================================================================================================="
  );
  const biddingFromBorrower = await makeBidding(borrower, {
    lender: ethers.constants.AddressZero,
    borrower: borrower.address,
    erc721: childERC721.address,
    tokenId: 0,
    erc20: erc20.address,
    amount: 100,
    listingExpiration: 0,
    biddingExpiration: Math.floor(Date.now() / 1000) + listingPeriod, // + 1 day,
    duration: rentalPeriod, // 1 day
  });
  console.log(biddingFromBorrower);

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
    .connect(lender)
    .fulfill(
      biddingFromBorrower.lender,
      biddingFromBorrower.borrower,
      biddingFromBorrower.erc721,
      biddingFromBorrower.tokenId,
      biddingFromBorrower.erc20,
      biddingFromBorrower.amount,
      biddingFromBorrower.listingExpiration,
      biddingFromBorrower.biddingExpiration,
      biddingFromBorrower.duration,
      biddingFromBorrower.signature
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
    lender.address,
    borrower.address,
    biddingFromBorrower.erc721,
    biddingFromBorrower.tokenId,
    biddingFromBorrower.erc20,
    biddingFromBorrower.amount,
    biddingFromBorrower.duration
  );
  console.log(`created id: ${id}`);
  console.log(await polyJuice.biddings(id));

  await increaseTime(rentalPeriod); // 1 day

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
