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

## Architecture

### The relationship between contracts

![alt text](https://s3.us-west-2.amazonaws.com/secure.notion-static.com/daeaa6fb-7b76-4534-92dc-2154d9a09737/Untitled.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAT73L2G45EIPT3X45%2F20230305%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20230305T161231Z&X-Amz-Expires=86400&X-Amz-Signature=2869d183373c3f121fbbfb38e02f0105170ed24197d30212df6f17f7e8e6b41c&X-Amz-SignedHeaders=host&response-content-disposition=filename%3D%22Untitled.png%22&x-id=GetObject)

### Listing / Make Offer

![alt text](https://s3.us-west-2.amazonaws.com/secure.notion-static.com/f687ae45-a7da-419d-9b8d-5540d5229939/Untitled.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAT73L2G45EIPT3X45%2F20230305%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20230305T161246Z&X-Amz-Expires=86400&X-Amz-Signature=f250777343170d60373f088ca8f4ad9cc865d18fe7769aa341eb9bce72a7b283&X-Amz-SignedHeaders=host&response-content-disposition=filename%3D%22Untitled.png%22&x-id=GetObject)

### Rent Now / Accept Offer

![alt text](https://s3.us-west-2.amazonaws.com/secure.notion-static.com/b4911af9-36f8-466a-91c3-9e9f64e12ffc/Untitled.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAT73L2G45EIPT3X45%2F20230305%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20230305T161259Z&X-Amz-Expires=86400&X-Amz-Signature=a565ccf2a8b7092a15e84334fcefb05530775f1b78ff90cf1b9d1ed78096369f&X-Amz-SignedHeaders=host&response-content-disposition=filename%3D%22Untitled.png%22&x-id=GetObject)

### Claim (after expiration)

![alt text](https://s3.us-west-2.amazonaws.com/secure.notion-static.com/dab278ea-9beb-445c-9dfd-28d135598ccc/Untitled.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAT73L2G45EIPT3X45%2F20230305%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20230305T161316Z&X-Amz-Expires=86400&X-Amz-Signature=ca9ecf89ce740a8eda1e0302d98c22fc0e2cf7873aaf99088050d252c8561be4&X-Amz-SignedHeaders=host&response-content-disposition=filename%3D%22Untitled.png%22&x-id=GetObject)

## 🚩 How to develop Polyjuice?

### 🌱 Pre-Installation

Before working on Polyjuice locally, you must have ...

- **node**
- **yarn**

</br>

### 📦 Installation

- Repository for frontend/backend

```shell
$ git clone https://github.com/polyjuice-denver/polyjuice.org
```

- Repository for contracts

```shell
$ git clone https://github.com/polyjuice-denver/PolyJuice
```

simply clone the repeositories

</br>

### 🔧 Configuration and Backend Setting

- On polyJuice.org repository...
  - On backend directory
    - If there is a file named `polyjuice.db` on root directory, delete that file.
    - run `yarn` to install packages.
    - run `yarn dev` to run local backend server.
- On PolyJuice repository...
  - Change the value of the variable `isDatabaseInitializedForNFTs` to `false` on the file `scripts/deployForDemo.ts`.
  - run `yarn hardhat run scripts/deployForDemo.ts` to deploy contract and complete setup

</br>

### ✅ COMPLETE

- On polyJuice.org repository...
  - On frontend directory
    - run `npm i` to install packages.
    - run `npm run dev` to run local frontend server.

**Your own local Polyjuice has been created!**

Improvements of code and issues of bugs Reports are always welcome. </br>
Please contribute in **Polyjuice through the issue page!**

</br>
