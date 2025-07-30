import limeBikeImage from "../assets/images/limeBike.png";

export const firstRewardConfig = {
  title: "Lime Bike | 20% Off Promo",
  description:
    "Celebrate the Sydney Marathon with Lime. Get 20% off your ride today only!",
  discount: "20% OFF",
  validity: "Today only",
  image: limeBikeImage,
  collectAction: {
    type: "discount",
    value: "20%",
    code: "LIME20",
    expiresAt: "2024-12-31",
  },
};
