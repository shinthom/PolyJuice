<div width="100%" height="100%" align="center">
  
<h1 align="center">
  <p align="center">✨ PolyJuice ✨</p>
  <a href="https://polyjuice.org/">
    <img width="80%" src="https://github.com/polyjuice-denver/polyjuice.org/blob/65452ba75a29ae3ae3c6db2025c5e4aaf757d315/frontend/public/polyjuice_square_intro.png" />
  </a>
</h1>
  
The First <b>Rental Market</b></br>
for <b>Multiverse NFTs</b>

</div>

## 👩🏻 Team member

- Jennifer Lee
- JB (Jeong Bum) Won
- Geonwoo Shin

## 📹 Demo Video

- [link](https://youtu.be/lsQlHELWQJ8)

## 💡 Introduction

- Problem
  > Smooth Reflection of Values Across Multiple Metaverses is Difficult
- Solution

  > PolyJuice Team Develops Solution to Multiverse NFT Problem

  > PolyJuice Team Creates New NFT Rental Structure to Avoid Potential Risks

</br>

## 🔍 About

> In 2021, the metaverse was clearly at the center of the phenomenal NFT bull market. The metaverse pandemic, which began with Facebook changing its name to Meta, has been intertwined with PFP NFT to create an on-chain multiverse narrative that, in the not-too-distant future, we will represent our digital identity as NFT.

> We, the PolyJuice team, still believe in this narrative and are waiting for the metaverses to be released, but we've realized that there are some critical problems with the ideal realization of this on-chain multiverse narrative, even though many metaverses will be ready in the near future.

> Here are the critical Problems we found & Solutions we made in serial to solve this problem :

### Main Problem

> In the case of multiverse NFT, ideally, the sum of the values obtained in each metaverse should be the most major factor of that multiverse NFT's value so that the implementation of the new metaverse can increase the value of the NFT, but it will be difficult to expect.

#### Reason Why

> If there are 10 Metaverses that a single BAYC can be played on, the maximum available time of that BAYC for a single day should be 240 hours. But since the holder of that NFT is just a single person, at best, he can utilize that 240 hours is 24 hours. It is, therefore, difficult to expect a smooth reflection of its values.

### Main Solution

> After separating the right to use a single NFT for each metaverse, generate profits by providing "the rights to use" to remaining metaverses except for the metaverse that the NFT holder will play on. This will induce substantial utility availability to NFT holders and eventually form instant cash flow.

### Sub Problems and Solutions

- Sub Problem 1
  > Through the first problem and solution, we learned that we need to split the utilities of an NFT into other NFTs. ( we call them baby NFTs )
  > Then, our next concern was about how to do it when trading it. Is it okay to be selling to others? Or is it have to be limited to rental?
- Sub Solution 1

  > We concluded that it should be limited to just rentals because selling split utilities only diminishes the value of the original NFT.

- Sub Problem 2
  > All existing NFT rental solutions require sending NFTs to smart contracts deployed by that solutions out of the owner's wallet to be lent.
- Sub Solution 2
  > After a member of our team found & report a critical bug in the reNFT's collateral-free NFT rental solution during research, we realized that the implementation of NFT rental using these methodologies ( sending NFT out of your wallet to not-reliable-enough smart contract) is potentially very risky, even in our contract. So we've created a whole new structure that allows NFT holders to split the utility and lend each one to another without putting their NFT in a contract. Under this system, all they have to do is verify that they currently have that original NFT.
  > The team is preparing to register this new system as an EIP, supporting it until it becomes an ERC.

<br>

<p align="center">
  <img width="15%" src="https://user-images.githubusercontent.com/51353146/143682058-099da099-cd52-4715-af37-ffe10c1dcfdb.png" />
</p>

<br>

### What We Have

- SO, WHAT WE HAVE BUIDL !

> PolyJuice, The First Rental Marketplace for Multiverse NFTs.

- WHY IT IS BENEFICIAL!

> PolyJuice allows NFT Holder to split its utilities by each metaverse and lend them to others so holders can make instant cash flow.

> In doing so, the NFT holder can expect the sum of utilities to be reflected in the present value of the NFT due to the resulting increase in cash flow each time a new utility is added.

> From the borrower's perspective, the person who borrows the NFT will also be very happy since they can become their favorite NFT on their favorite metaverse at a relatively cheaper price rather than directly buying it.

> From that metaverse perspective, there is a mass advantage of being able to onboard multiple NFTs (IPs).

> This is why we, the team, believe PolyJuice will be the revolutionary win-win-win product for the NFT community.

</br>

## 🏛 Architecture

The owner of an original NFT never has to move it. Each original collection
(`MotherERC721`) is paired with one `ChildERC721` per metaverse — a
non-transferable "utility" token that can only be moved by the protocol. Renting
transfers the child token, not the original, so the owner only has to prove they
still hold the mother token.

```
   MotherERC721                ChildERC721                 PolyJuice
   (original NFT)   ── pair ──► (utility token)  ── lend ──►  (core market)
        ▲                             │  ▲                        │
        │ ownerOf                     │  └──── settle ────────────┘
        └── verified on lend / claim ─┘                    escrows ERC20 (e.g. USDC)
```

### Contracts

| Contract | Responsibility |
| --- | --- |
| `PolyJuice.sol` | Core rental market. Pairs a mother collection with a child collection, matches signed listings/offers in `fulfill`, escrows the ERC20 payment, and settles usage-based fees in `settle`. |
| `ChildERC721.sol` | Non-transferable "utility" token bound to a mother token. Handles `lend` (on rental), `claim` (lender reclaims after expiration), and `repay` (borrower returns early). |
| `demo/` | `MotherERC721`, `USDC`, and `Faucet` helpers used for local demos and tests. |

### Listing / Make Offer

A lender lists a token for rent, or a borrower posts an offer on a token. Either
side signs the `biddingHash` off-chain; nothing is escrowed until the offer is
accepted.

### Rent Now / Accept Offer

The counterparty calls `fulfill` with the signed order. It verifies the
signature, pulls the payment into escrow, records the `Bidding`, and lends the
child token to the borrower for `duration`.

### Claim / Repay (settlement)

- **Repay** — the borrower returns the token before expiration. `settle` prorates
  the fee by the usage period, pays the lender, and refunds the remainder.
- **Claim** — after expiration the lender reclaims the token; `settle` pays out
  the full amount.

In both cases `ChildERC721` calls `PolyJuice.settle`, which finalizes the fee and
returns the child token to the origin owner.

## 🚩 How to develop PolyJuice

The contracts use [Foundry](https://book.getfoundry.sh/). Dependencies are managed as git submodules under `lib/`.

```shell
git clone https://github.com/shinthom/PolyJuice.git
cd PolyJuice
git submodule update --init --recursive

forge build   # compile
forge test    # run the test suite
```

The frontend/backend live in a separate repository:

```shell
git clone https://github.com/polyjuice-denver/polyjuice.org
```

### Deployment

```shell
forge script script/Deploy.s.sol \
  --rpc-url $RPC_URL --broadcast \
  --sig "run(address,string,string,string)" \
  <motherERC721> "Child" "cERC721" "sandbox"
```

Improvements of code and bug reports are always welcome through the issue page!

</br>
