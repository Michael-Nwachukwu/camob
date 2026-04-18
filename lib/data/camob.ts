import type {
  ApartmentTypeSummary,
  Attraction,
  BlockedDateRange,
  Booking,
  RatePlan,
  Unit
} from "@/lib/types";

export const siteCopy = {
  name: "Camob Residence",
  tagline: "Editorial shortlet living in Ogombo, Lekki.",
  description:
    "Beautifully designed short-stay apartments in Ogombo Town, Lekki Scheme 2, Lagos State, one minute from British Charter School and around twenty minutes to Victoria Island via the coastal road.",
  heroImage:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuD84mXJ3tFS_sU5sYc3-wCy5pRLOZN1R5wNb7SiI7S4FbvzfhOARpN9jKGIYvvZm9i_m-4fqDbM8znz2e_UuvvlPleGZiMd8E_W0nkb4UBRkbfLqkHx-5yKE7292RepYeS6g29nlBZ9EfB_qOfchGczMLQA41zRsjtNFnGzKqSAHJRSRtsYvhT0x0EGO0p6NjLRLAxH4z47FsVuzh-zLJsgiXQkwtuz7Gh_o5PcfXg7GL69BaDP-6sIXLN47NX-NGhqZlXI68Paqs4",
  neighborhoodImages: [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAw97L3hIf9pR_i8N_enZH9ACyPSDvo_3rCXJxfATMUBh5f2cZ9G9S9s9-oIUhJoB_SnfaRyR-9xm1o3lXu4aria3kXxbIDJH-6UpxNY3hEhFqmY46tL-aVLg_8bk1MeybsnYeH83UXrPpXM1Q-Lzd3OdMxsIYcjYTV2GgEta22--F5fSFMJVk6bcavScqKXfnQn7qxCWJv0zl5AJt5CqqT-AsuJJYvpg_YFD7z1YFrdVQPkXBCJZEKmNAr3aTaOVeCe2Vqp67j5eI",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBsOFAqvP0JKJryLdi5MxjMS6CQuv1nMtt5CaGZvATK0DcKm2HWNxiHIYvY3iDbLAm9q7GWkt37tE1scbv01wbQoq36Te-lGTvw77QEHvCeeVTemYNiq9Z4xp2qMGM0Rxp72AsqjbvKF8urDzKTKL-JqfU-nNh1ToNcuVnvuaVja6c-C1Jh3Zn3mFlS14_WFj8plPetAGGIctUjIEnhwrRM9zJZ_WGKy4nA3TTRG56JjOI9NJE-8qWDPS0lnRqhg6ih4DA5Q24OJHM",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAcLv9S3TAABJxI0mPz8Tv8uTzRCcejoiAsTrMeHev5rx6Nfa0LUJUNg-UbRPAAKM-tZzrcYyNySJOSZgklPWPyvm2E83kCipeNXcrPJzV3YvvThv9nlZkR31AUgGyDG4B9IRaKFy9r4p4BpCIhA9q61dGcFw6jIXRkwPl-txWtT_5pl8l3kJQfAmmVbWz7osoiX0A7nxAg9usJUKuOQHKJxpo37L4sgvQUWRDANLUfyK6lar8R6MhM-Wu8Iz2qT0oWsRP-a_kJGyM"
  ],
  exploreMapImage:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBznNUgCRX0b74W9kgiHZb-lgxMLFlzh_cLFGWgkqLn2VdCSwvK_oGBfJZAe9_O0S1qi7nKwhRt5jOTiV7BUk5NRdrCeApT6wkIKsACufGedK2UJw5578p7i4xMr3VQ0JNorvNlxjCMD_xJ8RM9cxebov5ISO2GDuMQWhx5w-PqORrbSU2vjI48Yv9ArJoItQvpBgWX9V46DG-i7Qmrucl6K0s_7JptBQEPFqGVevm5QV8IOh4qfAE05mrFuIkR8Ql2I7ilF876DIg",
  exploreFeatureImages: [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuD6zKSxDVSmrMWuvltMlyx188EK7ou06vX3Hq9sbST5VlTJPQdAl2mLhTy5AgFVRishpwckyBAcwNVorzOekEuScVcLkcjqT8GG9U_vqMHX-b4NejxiYxxLQTNn2NAURDsGig5kRChAKimxXhzqWAbFnPT9O8cNpHqyAF1wRjo-zdONoWxK6T0qOQYtIBG5S2qUrsUzlDRXVh0a3WHRjpKKa9FGJPVSfNDGZh2bKXrhuGwUZu7zmgdQLcyQtlnBoDA1p-xXfp5RnEE",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAX1pbx9YEznQZUAeNHRK9t_KutR4chy3s5y9C6QU7exAOZfobSlxISbEmNhro8WfqwPQhVe58-nN_pRa0plipXUjOfEZXIj8or25VLXMw1k3OBlHBfR38lIu8GcHQ0aYi99n1dOxMSb38_f8MowUSBpmuG8ju57VFp_8m1xoL8xwAGqD-EAnBX6Pv2_sRo187P7cqhoq6PzMOE4QEbApV2d4op-LdkqFQCtO_M0WmIPi7bYKI6SjCYsoXrDXTAyRO2Wqq59FzKUNU",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuB7NNQUcdgrGu-G89G4XgmdljS-OT3K0OGw16GcV0u4erzMh3OoFXlN8r_Rz-M7FzSEInVY0lDKlEXBIYVSjyIbVoxx75xkCWwO0xRZMpItsXBkm0qpQPw_0SKULTsqzjAyzUfJ14-G4Vy5bfhGQDExUS9MZlm4v7yc3BjwXe2XcHbQNGUxzsAXILR2TtMwc0oKH6icSD5GFwHRC_DOvpzX2T5BZXouYeCPG-sz2VhJPAY28MBEGO-pI_HKLCeNWzwYSws07N7JO4Q",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAh0YrajlsEoLbvyuasNqq479gppxA3e9VXk67tco21cvXNOT4n5P02PlPXG12oqqISKNf3l715BjazasP2ZSViamiVlvcIMISAhBUiaH-CpkLvalopIzajPDb7fSYcM0o8RlI2nXPx0w1RmEaVMTSEL5DMqh54JzEGNXxRM47dfOqGxjHpQcUy2B75M-_m2GnezFnw4Dsb9gZCWtiPsFqsT8zCm1I9Pi5Ln0sOPWkAmVUdZx97g48QaTG0KuwwAyynP9T3p3O-dEk",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuA0IzycaRfygVNHupCTo8KnWqtPluv5JkwuSsdbJjBvOvKbuWwrF7Xgd4qhBPIB4J-8kcaKVtdyrD-CVS20oY6GHRMEshuR0VU8iGtBebi7UMHOyNDRBXEeXbWvCUc4PF7CH7pI5K4DW48FRzzoz6qQuLRvRAdRfEvy4i8nYG-zsmg_KJGW5YFC4nRGPLtWH0CSy2JYCyyQF0hrkzQzGAnYy2mpb_F95XtdpF9eIT5AA77i8GXKR4s94Zxf_OiE6NM4ycQOMlc54HM"
  ],
  address: "Ogombo Town, Lekki Scheme 2, Lagos State, Nigeria",
  coordinates: {
    latitude: 6.4389,
    longitude: 3.5854
  },
  checkIn: "2:00 PM",
  checkOut: "12:00 PM",
  whatsapp: "https://wa.me/2348100000000",
  googleMapsLink: "https://maps.google.com/?q=Ogombo+Town+Lekki+Lagos",
  conciergeEmail: "reservations@camobresidence.com"
};

export const apartmentTypes: ApartmentTypeSummary[] = [
  {
    id: "one-bedroom",
    slug: "one-bedroom-urban-sanctuary",
    name: "1-Bedroom Urban Sanctuary",
    shortName: "1-Bedroom",
    description:
      "A warm, fully furnished apartment designed for solo travelers, couples, and compact work stays with reliable power, fast internet, and a calm residential rhythm.",
    longDescription:
      "An intimate one-bedroom residence with warm textures, reliable essentials, and the kind of calm layout that makes both quick stays and longer work trips feel easy.",
    ratePerNight: 75000,
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    units: 2,
    amenities: ["24/7 power", "High-speed internet", "DSTV Premium", "Fully furnished", "Dedicated workspace"],
    heroImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDkxXbUR3SmhfO5kpnkI7mX1FZgINmTdmzn2zk2gvmfEfHmvyyB3gBJHqN8He9d_4aSyYpmYnIT-0giHlA_eUYDqdrKPSJua5-GDu0GMw0vtWm7uyprolyws20cGKQGqXbIDOtIDwYz869M2S6pzp3ELZzFnk9UtdVfE4dmFGDV3_LZgJ3LGegtYbx_tS8XaYqviZOoT5pdIU1MN4r3iDedqWnqXWUxOPONRg3keUtxEFcEXUKlpMJ52TuGIe6RzKTV32NMCdIlr7U",
    gallery: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDkxXbUR3SmhfO5kpnkI7mX1FZgINmTdmzn2zk2gvmfEfHmvyyB3gBJHqN8He9d_4aSyYpmYnIT-0giHlA_eUYDqdrKPSJua5-GDu0GMw0vtWm7uyprolyws20cGKQGqXbIDOtIDwYz869M2S6pzp3ELZzFnk9UtdVfE4dmFGDV3_LZgJ3LGegtYbx_tS8XaYqviZOoT5pdIU1MN4r3iDedqWnqXWUxOPONRg3keUtxEFcEXUKlpMJ52TuGIe6RzKTV32NMCdIlr7U",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCd2vXTRA2EqeujGczA8YMDfZkRsRTMNQWUQmqPzrzydaoefn_UJTt5DTO_KbxLyAfkQ80MyRP5prdeZtHboHlGRqObsDc2c-87RO8InkvAuwtmpywnfjtFSlROUBtqb09B61YzCaEaiWay07q7DVV2XQWsNGsDZKdSpcFJdOG7SkyOlk5Y77r-DyOmugyaIwCERoXAjnGVE7I9JnT9D1lYEMvspiQCdBk2bbHlkRLh4WOI_FSTqoNTuKdGD-pay0v312HYZczke18",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBiu2lx7ICvwAnydq1a2mp1rJW2sMr9hiAHH0qjhsvsLTOSeVRfXmuBbRggxWg9mFtWEPyCIifs5pDKIHziox2_DWy_Uvd8LTed4AhX3d2bLig4ZXoiZmHBx3OU6pv3PlJA8G0bWDzj-4uTFwOtCl1GbXb1LhY1WUnqSvD0cMovD2rL6p9VzcvBkbeUq2ntRrWKgNRW7BohKJPLK6YPyMHhf2H0yJInQ1QDqNnA6qAwDa6dMSxQGMcEPA_e4osrCikuGpAN-yDLii8"
    ]
  },
  {
    id: "two-bedroom",
    slug: "two-bedroom-executive-suite",
    name: "2-Bedroom Executive Suite",
    shortName: "2-Bedroom",
    description:
      "A refined two-bedroom shortlet for families, business guests, or group stays, with more room to settle in without losing the premium feel.",
    longDescription:
      "A spacious two-bedroom layout with a stronger luxury tone, editorial-style interiors, and enough flexibility for family, business, or group visits.",
    ratePerNight: 120000,
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 2,
    units: 2,
    amenities: ["24/7 power", "High-speed internet", "DSTV Premium", "Fully furnished", "Dining area"],
    heroImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAs9Y9piuiSAg8g60cKBBl8M4r7F9FQse8mqDiQxCUV4WE9EU5msOHXz_v2AlwlfKJ4rG03Qmj0LbUAptL2RLXG8JWicxa1HZRAs4m8MWohfSwa_Lcua-Qoyj0KUd3HhK7cX9hzIU5K7K3p5yDgbDsKfkJyxcgsAawLkSDnTCC7CTOjsDzYE21SpL6EKQNr2uIylnMHl0WkY-rJjYARL9rk3zdfsnmRcmKb4AV-kBHFI_DTy_B2Yz9PJhNMeI_BIz_fmp82tDCFCO8",
    gallery: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCd2vXTRA2EqeujGczA8YMDfZkRsRTMNQWUQmqPzrzydaoefn_UJTt5DTO_KbxLyAfkQ80MyRP5prdeZtHboHlGRqObsDc2c-87RO8InkvAuwtmpywnfjtFSlROUBtqb09B61YzCaEaiWay07q7DVV2XQWsNGsDZKdSpcFJdOG7SkyOlk5Y77r-DyOmugyaIwCERoXAjnGVE7I9JnT9D1lYEMvspiQCdBk2bbHlkRLh4WOI_FSTqoNTuKdGD-pay0v312HYZczke18",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCt7GR-OJd6OIP1YyBczbeI0vK02rYmzGRV9CTLnkKFP5lHwqu_z820E9u6mIhvzpG0C3ff-PwpNLT1kvQ94VC3k5wTeJcz2aO8Re13DF98CRrYXJRPx86f_9YLBEFmWpXIQcS6ebVR78DwqNqW1yjl5Ss7niAVQLWiDEffnIgIJmPS2k2Wv3-emM2oTDNVy1HLWl2RDtHjmh1G_BnCbIfVkYs0axh7KIZ-nKkv-vf7JdfslH-YF9iFI6bopjOudC0xXy0in8paGPI",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBiu2lx7ICvwAnydq1a2mp1rJW2sMr9hiAHH0qjhsvsLTOSeVRfXmuBbRggxWg9mFtWEPyCIifs5pDKIHziox2_DWy_Uvd8LTed4AhX3d2bLig4ZXoiZmHBx3OU6pv3PlJA8G0bWDzj-4uTFwOtCl1GbXb1LhY1WUnqSvD0cMovD2rL6p9VzcvBkbeUq2ntRrWKgNRW7BohKJPLK6YPyMHhf2H0yJInQ1QDqNnA6qAwDa6dMSxQGMcEPA_e4osrCikuGpAN-yDLii8"
    ]
  }
];

export const units: Unit[] = [
  { id: "unit-1a", apartmentTypeId: "one-bedroom", name: "1-Bedroom A", floorLabel: "Ground Floor" },
  { id: "unit-1b", apartmentTypeId: "one-bedroom", name: "1-Bedroom B", floorLabel: "Upper Floor" },
  { id: "unit-2a", apartmentTypeId: "two-bedroom", name: "2-Bedroom A", floorLabel: "Ground Floor" },
  { id: "unit-2b", apartmentTypeId: "two-bedroom", name: "2-Bedroom B", floorLabel: "Upper Floor" }
];

export const ratePlans: RatePlan[] = [
  {
    id: "rate-one-bedroom-base",
    apartmentTypeId: "one-bedroom",
    nightlyRate: 75000,
    serviceCharge: 15000,
    currency: "NGN"
  },
  {
    id: "rate-two-bedroom-base",
    apartmentTypeId: "two-bedroom",
    nightlyRate: 120000,
    serviceCharge: 15000,
    currency: "NGN"
  }
];

export const attractions: Attraction[] = [
  {
    id: "british-charter-school",
    name: "British Charter School",
    category: "Culture",
    distanceKm: 0.5,
    driveTime: "1 min",
    description: "A major local landmark just moments from the residence.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD6zKSxDVSmrMWuvltMlyx188EK7ou06vX3Hq9sbST5VlTJPQdAl2mLhTy5AgFVRishpwckyBAcwNVorzOekEuScVcLkcjqT8GG9U_vqMHX-b4NejxiYxxLQTNn2NAURDsGig5kRChAKimxXhzqWAbFnPT9O8cNpHqyAF1wRjo-zdONoWxK6T0qOQYtIBG5S2qUrsUzlDRXVh0a3WHRjpKKa9FGJPVSfNDGZh2bKXrhuGwUZu7zmgdQLcyQtlnBoDA1p-xXfp5RnEE"
  },
  {
    id: "lekki-conservation",
    name: "Lekki Conservation Centre",
    category: "Nature",
    distanceKm: 8,
    driveTime: "10 min",
    description: "Canopy walks, nature trails, and one of Lekki's most iconic green escapes.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBsOFAqvP0JKJryLdi5MxjMS6CQuv1nMtt5CaGZvATK0DcKm2HWNxiHIYvY3iDbLAm9q7GWkt37tE1scbv01wbQoq36Te-lGTvw77QEHvCeeVTemYNiq9Z4xp2qMGM0Rxp72AsqjbvKF8urDzKTKL-JqfU-nNh1ToNcuVnvuaVja6c-C1Jh3Zn3mFlS14_WFj8plPetAGGIctUjIEnhwrRM9zJZ_WGKy4nA3TTRG56JjOI9NJE-8qWDPS0lnRqhg6ih4DA5Q24OJHM"
  },
  {
    id: "landmark-beach",
    name: "Landmark Beach",
    category: "Beach",
    distanceKm: 10,
    driveTime: "15 min",
    description: "A polished coastal destination for beach lounging, food, and events.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAw97L3hIf9pR_i8N_enZH9ACyPSDvo_3rCXJxfATMUBh5f2cZ9G9S9s9-oIUhJoB_SnfaRyR-9xm1o3lXu4aria3kXxbIDJH-6UpxNY3hEhFqmY46tL-aVLg_8bk1MeybsnYeH83UXrPpXM1Q-Lzd3OdMxsIYcjYTV2GgEta22--F5fSFMJVk6bcavScqKXfnQn7qxCWJv0zl5AJt5CqqT-AsuJJYvpg_YFD7z1YFrdVQPkXBCJZEKmNAr3aTaOVeCe2Vqp67j5eI"
  },
  {
    id: "novare-mall",
    name: "Novare Mall",
    category: "Retail",
    distanceKm: 5,
    driveTime: "7 min",
    description: "Retail shopping, quick dining, and practical everyday conveniences.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAX1pbx9YEznQZUAeNHRK9t_KutR4chy3s5y9C6QU7exAOZfobSlxISbEmNhro8WfqwPQhVe58-nN_pRa0plipXUjOfEZXIj8or25VLXMw1k3OBlHBfR38lIu8GcHQ0aYi99n1dOxMSb38_f8MowUSBpmuG8ju57VFp_8m1xoL8xwAGqD-EAnBX6Pv2_sRo187P7cqhoq6PzMOE4QEbApV2d4op-LdkqFQCtO_M0WmIPi7bYKI6SjCYsoXrDXTAyRO2Wqq59FzKUNU"
  },
  {
    id: "sky-mall",
    name: "Sky Mall",
    category: "Retail",
    distanceKm: 4,
    driveTime: "5 min",
    description: "Easy-access shopping and entertainment on the Lekki axis.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB7NNQUcdgrGu-G89G4XgmdljS-OT3K0OGw16GcV0u4erzMh3OoFXlN8r_Rz-M7FzSEInVY0lDKlEXBIYVSjyIbVoxx75xkCWwO0xRZMpItsXBkm0qpQPw_0SKULTsqzjAyzUfJ14-G4Vy5bfhGQDExUS9MZlm4v7yc3BjwXe2XcHbQNGUxzsAXILR2TtMwc0oKH6icSD5GFwHRC_DOvpzX2T5BZXouYeCPG-sz2VhJPAY28MBEGO-pI_HKLCeNWzwYSws07N7JO4Q"
  },
  {
    id: "tiger-active",
    name: "Tiger Active Sports Complex",
    category: "Sports",
    distanceKm: 6,
    driveTime: "10 min",
    description: "Fitness, football, swimming, and active recreation nearby.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAh0YrajlsEoLbvyuasNqq479gppxA3e9VXk67tco21cvXNOT4n5P02PlPXG12oqqISKNf3l715BjazasP2ZSViamiVlvcIMISAhBUiaH-CpkLvalopIzajPDb7fSYcM0o8RlI2nXPx0w1RmEaVMTSEL5DMqh54JzEGNXxRM47dfOqGxjHpQcUy2B75M-_m2GnezFnw4Dsb9gZCWtiPsFqsT8zCm1I9Pi5Ln0sOPWkAmVUdZx97g48QaTG0KuwwAyynP9T3p3O-dEk"
  },
  {
    id: "sailors-lounge",
    name: "Sailor's Lounge",
    category: "Dining",
    distanceKm: 11,
    driveTime: "18 min",
    description: "Waterside dining with a polished Lagos evening atmosphere.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAcLv9S3TAABJxI0mPz8Tv8uTzRCcejoiAsTrMeHev5rx6Nfa0LUJUNg-UbRPAAKM-tZzrcYyNySJOSZgklPWPyvm2E83kCipeNXcrPJzV3YvvThv9nlZkR31AUgGyDG4B9IRaKFy9r4p4BpCIhA9q61dGcFw6jIXRkwPl-txWtT_5pl8l3kJQfAmmVbWz7osoiX0A7nxAg9usJUKuOQHKJxpo37L4sgvQUWRDANLUfyK6lar8R6MhM-Wu8Iz2qT0oWsRP-a_kJGyM"
  },
  {
    id: "yemisi-shyllon",
    name: "Yemisi Shyllon Museum of Art",
    category: "Culture",
    distanceKm: 12,
    driveTime: "20 min",
    description: "A strong cultural option for guests who want art and Nigerian heritage.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA0IzycaRfygVNHupCTo8KnWqtPluv5JkwuSsdbJjBvOvKbuWwrF7Xgd4qhBPIB4J-8kcaKVtdyrD-CVS20oY6GHRMEshuR0VU8iGtBebi7UMHOyNDRBXEeXbWvCUc4PF7CH7pI5K4DW48FRzzoz6qQuLRvRAdRfEvy4i8nYG-zsmg_KJGW5YFC4nRGPLtWH0CSy2JYCyyQF0hrkzQzGAnYy2mpb_F95XtdpF9eIT5AA77i8GXKR4s94Zxf_OiE6NM4ycQOMlc54HM"
  }
];

export const blockedDateRanges: BlockedDateRange[] = [
  {
    id: "block-01",
    apartmentTypeId: "two-bedroom",
    startDate: "2026-04-19",
    endDate: "2026-04-21",
    reason: "Deep cleaning and inspection"
  }
];

export const seededBookings: Booking[] = [
  {
    id: "booking-01",
    unitId: "unit-1a",
    apartmentTypeId: "one-bedroom",
    checkIn: "2026-04-02",
    checkOut: "2026-04-05",
    status: "confirmed",
    guest: {
      fullName: "Amina Yusuf",
      email: "amina@example.com",
      phone: "+2348000000001",
      guests: 2
    },
    subtotal: 225000,
    serviceCharge: 15000,
    total: 240000,
    createdAt: "2026-03-20T10:00:00.000Z",
    paymentMethod: "paystack",
    paymentStatus: "paid",
    paymentReference: "PSK_CAMOB_01"
  },
  {
    id: "booking-02",
    unitId: "unit-2a",
    apartmentTypeId: "two-bedroom",
    checkIn: "2026-04-13",
    checkOut: "2026-04-17",
    status: "confirmed",
    guest: {
      fullName: "Tunde Adeoye",
      email: "tunde@example.com",
      phone: "+2348000000002",
      guests: 4
    },
    subtotal: 480000,
    serviceCharge: 15000,
    total: 495000,
    createdAt: "2026-03-21T13:30:00.000Z",
    paymentMethod: "bank_transfer",
    paymentStatus: "pending_review",
    paymentReference: "BANK_CAMOB_02"
  },
  {
    id: "booking-03",
    unitId: "unit-2b",
    apartmentTypeId: "two-bedroom",
    checkIn: "2026-04-13",
    checkOut: "2026-04-16",
    status: "draft_hold",
    guest: {
      fullName: "Favour Ojo",
      email: "favour@example.com",
      phone: "+2348000000003",
      guests: 3
    },
    subtotal: 360000,
    serviceCharge: 15000,
    total: 375000,
    createdAt: "2026-03-25T13:00:00.000Z",
    expiresAt: "2026-03-26T23:59:59.000Z",
    paymentMethod: "paystack",
    paymentStatus: "initialized",
    paymentReference: "PSK_CAMOB_03"
  }
];

export const faqItems = [
  {
    question: "What time is check-in and check-out?",
    answer: "Check-in starts at 2:00 PM and check-out is by 12:00 PM. Flexible requests can be reviewed based on availability."
  },
  {
    question: "Do I need an account to book?",
    answer: "No. Guests can make a reservation without creating an account in v1."
  },
  {
    question: "How is availability managed?",
    answer: "Availability is calculated per physical unit, not just by apartment type, so inventory remains accurate when multiple guests book the same class."
  }
];
