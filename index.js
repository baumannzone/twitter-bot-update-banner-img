import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import Jimp from 'jimp';
import axios from 'axios';
import sharp from 'sharp';

import { TwitterClient } from 'twitter-api-client';

const TWITTER_USERNAME = 'baumannzone';
const SPACE_X_BETWEEN_IMAGES = 70;
const SPACE_Y_BETWEEN_IMAGES = 70;
const NUMBER_OF_FOLLOWERS = 6;
const COORD_X_IMG = 1225;
const COORD_Y_IMG = 180;
const IMAGE_SIZE = 80;

const twitterClient = new TwitterClient({
  apiKey: process.env.API_KEY,
  apiSecret: process.env.API_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
});

const downloadProfileImg = async (url, imgPath) => {
  await axios({ url, responseType: 'arraybuffer' }).then(
    (response) =>
      new Promise((resolve, reject) => {
        resolve(
          sharp(response.data).resize(IMAGE_SIZE, IMAGE_SIZE).toFile(imgPath)
        );
      })
  );
};

const getLatestFollowers = async () => {
  const data = await twitterClient.accountsAndUsers.followersList({
    screen_name: TWITTER_USERNAME,
    count: NUMBER_OF_FOLLOWERS,
  });

  let count = 0;
  const downloads = new Promise((resolve, reject) => {
    data.users.forEach((user, index, arr) => {
      downloadProfileImg(user.profile_image_url_https, `img/${index}.png`).then(
        () => {
          count++;
          if (count === arr.length) {
            resolve();
          }
        }
      );
    });
  });

  downloads.then(() => {
    makeBanner();
  });
};

const makeBanner = async () => {
  const promises = [];
  const images = [
    'base.png',
    ...[...Array(NUMBER_OF_FOLLOWERS)].map((_, index) => `${index}.png`),
  ];

  images.forEach((image) => promises.push(Jimp.read(`img/${image}`)));

  Promise.all(promises).then(([banner, ...profileImages]) => {
    profileImages.forEach((image, index) => {
      let row = Math.floor(index / 3);
      let col = index % 3;
      banner.composite(
        image.circle(),
        COORD_X_IMG + col * SPACE_X_BETWEEN_IMAGES,
        COORD_Y_IMG + row * SPACE_Y_BETWEEN_IMAGES
      );
    });
    // banner.composite(img2.circle(), COORD_X_IMG, COORD_Y_IMG);
    // banner.composite(
    //   img1.circle(),
    //   COORD_X_IMG + SPACE_X_BETWEEN_IMAGES,
    //   COORD_Y_IMG
    // );
    // banner.composite(
    //   img0.circle(),
    //   COORD_X_IMG + SPACE_X_BETWEEN_IMAGES * 2,
    //   COORD_Y_IMG
    // );
    banner.write('img/1500x500.png', () => {
      // uploadBanner();
    });
  });
};

const uploadBanner = async () => {
  const base64 = fs.readFileSync('img/1500x500.png', { encoding: 'base64' });
  try {
    await twitterClient.accountsAndUsers.accountUpdateProfileBanner({
      banner: base64,
    });
  } catch (err) {
    console.log(err);
  }
};

getLatestFollowers();
