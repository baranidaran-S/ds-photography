/* ═══════════════════════════════════════════════════════════════════════════
   GALLERY STORIES: the page for each kind of shoot (e.g. /gallery/weddings/hindu-wedding)
   ───────────────────────────────────────────────────────────────────────────
   PHOTOS: one folder for each kind of shoot. Nothing to change in this file:
     public/images/stories/<kind of shoot>/
       cover.jpg          its card on the category page (and the photo at the top of its own
                          page, unless there's a hero.jpg)
       hero.jpg           (if wanted) a different photo for the top of its own page
       01.jpg, 02.jpg, …  the photos, shown in name order
   Any shape works, and .jpg, .png and .webp all do. Add, swap or delete files and the page
   follows (the live site picks them up the next time it's published).

   WORDS: one block for each kind of shoot, below: their names, the date and place of the
   shoot, their experience in `description`, and the photos they love most in `loved`.
   Anything left empty ("" or []) shows a placeholder on the page instead. EVERYTHING BELOW IS
   DUMMY CONTENT for now (made-up names, dates, places, words and favourites): replace it with
   real clients, with their permission.

   A cover with `stock` is a free Pexels/Unsplash (or AI-made) stand-in: replace it with the
   studio's own photo before the site goes live, then delete its `stock` line.
   ═══════════════════════════════════════════════════════════════════════════ */

export type StoryWords = {
  /** Who it's about: "Ananya & Sourav", "Baby Ved", … */
  names?: string;
  date?: string;
  place?: string;
  /** Their experience of working with our team, in their own words, shown beside "What it was
      like with our team". One paragraph per line, each in quotes and followed by a comma:
        description: ["First paragraph.", "Second paragraph."],
      Leave it empty, [], until it's written. */
  description?: string[];
  /** The photos they love most, shown after their experience: up to five, by number in the
      photos' order (1 = the first photo, 01.jpg), e.g. loved: [2, 5, 1, 8, 3],
      Leave it out, or [], and the section doesn't show. */
  loved?: number[];
  /** About the cover photo: what it shows (for search engines and screen readers), the focus
      point "x% y%" that stays in view when it's cropped, and where a stand-in is from */
  cover?: { alt?: string; position?: string; stock?: string };
};

export const stories: Record<string, StoryWords> = {
  // ── Weddings ──
  "hindu-wedding": {
    description: [
      "We had met three photographers before DS, and we chose them within ten minutes. Sivakumar asked about our families, not our packages: who would cry, which aunt runs the show, and which rituals mattered most to Sourav's grandmother.",
      "On the day the team was everywhere and nowhere. Up on chairs for the shubho drishti, down on the floor for the haldi, and never once in the way of our guests or the priest.",
      "Three weeks later the album arrived, and our parents went quiet turning the pages. Moments we never saw ourselves were all there: our fathers wiping their eyes, my little cousin asleep under the mandap.",
    ],
    names: "Ananya & Sourav",
    loved: [3, 6, 2, 5, 1],
    date: "February 2025",
    place: "Kolkata",
    cover: {
      alt: "Bride and groom in shola crowns seated by the sacred fire during their wedding rituals",
      position: "50% 40%",
    },
  },
  "christian-wedding": {
    description: [
      "From the bridal preparations at home to the last dance at the reception, the team never missed a beat. They knew exactly when to step back during the vows and when to come close for the exchange of rings.",
      "Our families come from two different traditions, and somehow every photo shows both. Even the priest asked for their number after the service.",
    ],
    names: "Priya & Daniel",
    loved: [3, 6, 2, 5, 1],
    date: "April 2025",
    place: "Madurai",
    cover: {
      alt: "Groom in a suit and bride in a red silk saree with rose garlands at a church wedding in Chennai",
      stock: "Dream_ maKkerzz, Pexels",
    },
  },
  "muslim-wedding": {
    description: [
      "We were worried about photos during the Nikah, but the team respected every custom and knew where to stand without being told. Our elders felt completely at ease with them.",
      "The candid shots from the walima are our favourites: our nephews running around, my mother laughing with her sisters. It feels like we can live the whole day again.",
    ],
    names: "Ayesha & Imran",
    date: "January 2025",
    place: "Madurai",
    cover: {
      alt: "Groom kissing the forehead of his bride, who wears a navy hijab and bridal jewellery",
      stock: "Beard Kid, Pexels",
    },
  },
  reception: {
    description: [
      "Six hundred guests, one stage and a long queue of greetings, and yet every family that came up to bless us is in our album.",
      "They also slipped away from the stage for the little moments: our grandparents dancing, our friends' speeches, and the two of us stealing a quiet minute together.",
    ],
    names: "Divya & Karthik",
    loved: [4, 1, 6, 2, 5],
    date: "March 2025",
    place: "Madurai",
    cover: {
      alt: "Bride and groom on a floral reception stage lit by chandeliers",
      stock: "Fliqa India, Pexels",
    },
  },
  nalangu: {
    description: [
      "Nalangu is pure fun in our family, with turmeric, teasing and songs, and the team joined right in. They laughed along with us and still caught every game and every splash of colour.",
      "Our grandmother still asks to see the photo of Arun losing the coconut game.",
    ],
    names: "Keerthana & Arun",
    date: "May 2025",
    place: "Tirunelveli",
    cover: {
      alt: "Couple laughing together, smeared with turmeric, at a playful pre-wedding ritual",
      stock: "Deepak Joshy, Pexels",
    },
  },
  "mehendi-haldi": {
    description: [
      "Haldi mornings are chaos, but the team was ready before we were. They caught the yellow everywhere, the music, and my friends dragging Rahul into the dance.",
      "The mehendi close-ups are so detailed that you can find his name hidden in the design.",
    ],
    names: "Sneha & Rahul",
    date: "December 2024",
    place: "Chennai",
    cover: {
      alt: "Bride covered in turmeric at her haldi ceremony, surrounded by friends' hands",
      position: "50% 40%",
    },
  },
  sangeet: {
    description: [
      "Our families practised their dances for weeks, and the team made sure every single performance was captured, even my uncle's surprise solo.",
      "The lights were low and everyone was moving, yet the photos are sharp and full of colour. It looks like a film.",
    ],
    names: "Pooja & Vikram",
    date: "February 2025",
    place: "Coimbatore",
    cover: {
      alt: "Couple dancing under stage lights at a sangeet night",
      stock: "Love Deep, Pexels",
    },
  },
  "temple-wedding": {
    description: [
      "A temple wedding moves fast and there is very little room, but the team knew the rituals and the temple well. They were in the right place for the thali, the saptapadi and every blessing from the elders.",
      "They worked quietly around the priests and the devotees, and never once asked anyone to stop or pose.",
    ],
    names: "Meenakshi & Senthil",
    date: "June 2025",
    place: "Thiruparankundram, Madurai",
    cover: {
      alt: "Bride and groom in gold silk and garlands, foreheads touching at a temple wedding",
    },
  },
  "destination-wedding": {
    description: [
      "A wedding in the hills was stressful to plan, but the team arrived a day early to scout the light and the locations. On the day they knew exactly where the mist would roll in.",
      "Our guests still talk about the sunset portraits by the lake. They felt like part of our travel crew, not people we had hired.",
    ],
    names: "Nila & Aditya",
    date: "September 2024",
    place: "Kodaikanal",
    cover: {
      alt: "Bride and groom at a palace pavilion in Jodhpur under a blue sky",
      stock: "Fotographiya Wedding Photography, Pexels",
    },
  },
  // ── Couple ──
  engagement: {
    description: [
      "Our engagement was a small family function at home, and the team blended right in. They captured the ring exchange, the plates of gifts and every nervous smile in between.",
      "We had a few previews the same night, which we shared with everyone who couldn't be there.",
    ],
    names: "Harini & Prakash",
    date: "October 2024",
    place: "Madurai",
    cover: {
      alt: "Groom slipping a ring onto the bride's hennaed finger above red roses",
    },
  },
  "pre-wedding": {
    description: [
      "Kabir hates cameras, so we were dreading this. Within an hour he was laughing so much we had to stop for breath, and that is the photo everyone asks about.",
      "They planned the whole morning around the light: sunrise at the ruins, then the lake as the day warmed up. All we had to do was turn up and hold hands.",
    ],
    names: "Riya & Kabir",
    date: "November 2024",
    place: "Hampi",
    cover: {
      alt: "Couple embracing at the edge of a lake",
      position: "44% 50%",
    },
  },
  "save-the-date": {
    description: [
      "We wanted something different for our save-the-date, and the team suggested the sea at Dhanushkodi at sunrise. They planned the outfits, the timing and even the little props.",
      "Our invitations used their photos, and so many guests asked us who took them.",
    ],
    names: "Janani & Vignesh",
    date: "July 2025",
    place: "Rameswaram",
    cover: {
      alt: "Couple on a vintage scooter holding Save the Date posters in a field",
      stock: "Beard Kid, Pexels",
    },
  },
  "post-wedding": {
    description: [
      "After the rush of the wedding, this shoot was just the two of us, relaxed, in the old French streets. The team kept it light and fun, and we finally had time to enjoy each other.",
      "These are the photos on our walls now. They feel the most like us.",
    ],
    names: "Kavya & Surya",
    date: "August 2025",
    place: "Puducherry",
    cover: {
      alt: "Couple standing forehead to forehead on a lantern-lit balcony with white pillars",
    },
  },
  anniversary: {
    description: [
      "Our children surprised us with a shoot for our twenty-fifth anniversary, and we were shy at first. The team made us feel young again, and by the end we were laughing like newlyweds.",
      "The photo of us holding hands under the mango tree is the one the whole family loves.",
    ],
    names: "Lakshmi & Raman",
    date: "November 2024",
    place: "Madurai",
    cover: {
      alt: "Married couple smiling in front of a floral anniversary backdrop",
      stock: "Srijit Mudi, Pexels",
    },
  },
  // ── Maternity & Baby ──
  maternity: {
    description: [
      "I was nervous about a maternity shoot, but they made me feel beautiful and comfortable the whole time. They planned the gown and the light, and gave me a break whenever I needed one.",
      "Gokul usually hates photos, and even he loved how natural it all felt.",
    ],
    names: "Revathi & Gokul",
    loved: [4, 1, 6, 2, 5],
    date: "March 2025",
    place: "Madurai",
    cover: {
      alt: "Mother-to-be in a lavender gown, its flowing fabric spread out like butterfly wings",
    },
  },
  "baby-shower": {
    description: [
      "With two families and a house full of guests, we worried the day would pass in a blur. The team quietly made sure every grandmother, every bangle and every blessing was caught.",
      "They were so patient with me, finding me a chair between rituals and never asking me to stand longer than I could.",
    ],
    names: "Meghna & Arijit",
    loved: [2, 5, 1, 6, 3],
    date: "August 2025",
    place: "Bengaluru",
    cover: {
      alt: "Mother-to-be in a red silk saree beside BABY letter blocks and a balloon arch",
      position: "55% 40%",
    },
  },
  newborn: {
    description: [
      "We were nervous about a newborn shoot at home, but they arrived with warm wraps, a heater and endless patience. Ved slept almost the whole time.",
      "Nothing was rushed. They waited through feeds and cuddles, and still left us with photos we will treasure forever.",
    ],
    names: "Baby Ved",
    loved: [5, 2, 4, 1, 6],
    date: "March 2025",
    place: "Chennai",
    cover: {
      alt: "Newborn smiling in his sleep, wrapped in white in a cane cradle",
      position: "45% 50%",
    },
  },
  "naming-ceremony": {
    description: [
      "The naming ceremony was small and very traditional, and the team understood every step. They caught the moment my father whispered her name into her ear.",
      "They were gentle around the baby and kept the flash away from her eyes. We could not have asked for more care.",
    ],
    names: "Baby Aadhira",
    loved: [3, 6, 2, 5, 1],
    date: "January 2025",
    place: "Madurai",
    cover: {
      alt: "Women in silk saris gently swinging a baby in a cloth cradle",
      stock: "Ashish Keshkar, Pexels",
    },
  },
  "baby-milestones": {
    description: [
      "We booked sessions at three, six and nine months, and it was lovely having the same team each time. They remembered Kavin's favourite toys and songs.",
      "Side by side, the three sessions show how fast he grew. It is our favourite thing in the house.",
    ],
    names: "Little Kavin",
    date: "2024 – 2025",
    place: "Madurai",
    cover: {
      alt: "Baby girl in pink sitting beside a 6-month milestone sign",
      stock: "Krishna Kids Photography, Pexels",
    },
  },
  "ear-piercing": {
    description: [
      "The ear piercing at the temple was emotional for all of us, and the team handled it beautifully. They caught her brave little face and the hug right after.",
      "They were quick, quiet and patient through the crowd, and they knew exactly when to lower the camera.",
    ],
    names: "Baby Yazhini",
    date: "February 2025",
    place: "Palani",
    cover: {
      alt: "Baby with a turmeric-smeared head at the ear-piercing ceremony, family hands and marigolds around",
      stock: "Rajan Pugazh, Pexels",
    },
  },
  "first-rice-feeding": {
    description: [
      "Ishaan's first taste of rice was a big moment for both our families, and the team caught every expression, from curious to delighted.",
      "Even with the whole family crowded around, they found the best angles without getting in anyone's way.",
    ],
    names: "Baby Ishaan",
    date: "April 2025",
    place: "Madurai",
    cover: {
      alt: "Father feeding his baby from a ceremonial spread of rice and brass bowls",
      stock: "Fliqa India, Pexels",
    },
  },
  // ── Kids & Birthdays ──
  "first-birthday": {
    description: [
      "Keeping a one-year-old happy for one photo is hard; keeping her happy for a whole party is harder. They played peekaboo, chased balloons and got her best giggles.",
      "They caught the grown-ups too: grandparents dancing, friends laughing. It is the whole party in pictures, not just the cake.",
    ],
    names: "Myra turns one",
    loved: [4, 1, 6, 2, 5],
    date: "June 2025",
    place: "Kochi",
    cover: {
      alt: "Birthday girl among yellow balloons as confetti falls",
      position: "52% 55%",
    },
  },
  "kids-birthday": {
    description: [
      "Twenty excited five-year-olds and a superhero theme, and the team kept up with all of it. They caught the games, the gifts and the moment Aarav blew out his candles.",
      "They also took lovely photos of our parents and friends, so the whole party is there.",
    ],
    names: "Aarav turns five",
    date: "May 2025",
    place: "Madurai",
    cover: {
      alt: "Little girl in a purple party dress holding up a gold number 5 balloon on a lawn",
    },
  },
  "cake-smash": {
    description: [
      "The cake smash was messy and wonderful. The team set up the colours, the balloons and the cake, and then simply let Mithra be herself.",
      "Every expression, from puzzled to delighted to covered in cream, is in the gallery.",
    ],
    names: "Baby Mithra",
    loved: [4, 1, 6, 2, 5],
    date: "March 2025",
    place: "Madurai",
    cover: {
      alt: "Baby with cake on her face during the cake smash",
      position: "35% 40%",
    },
  },
  "kids-portraits": {
    description: [
      "Diya is shy with new people, but within minutes the team had her giggling. They let her play and caught the real smiles.",
      "We framed one of her in her silk pavadai for her grandparents, and they cried happy tears.",
    ],
    names: "Little Diya",
    loved: [2, 5, 1, 6, 3],
    date: "January 2025",
    place: "Madurai",
    cover: {
      alt: "Smiling girl in a silk pattu pavadai sitting outdoors among green trees",
      stock: "Anoop VS, Pexels",
    },
  },
  // ── Family functions ──
  "puberty-ceremony": {
    description: [
      "Manjal Neerattu Vizha is a big day in our family, and the team treated every ritual with care and respect. Sowmya felt comfortable with them from the very start.",
      "They captured the blessings from every elder, the turmeric bath, and the joy on her face in her first silk saree.",
    ],
    names: "Sowmya",
    loved: [2, 5, 1, 6, 3],
    date: "June 2025",
    place: "Madurai",
    cover: {
      alt: "Smiling girl in a maroon silk saree as her grandmother applies turmeric to her cheek and her mother holds the aarti plate",
      position: "50% 30%",
      stock: "AI-generated picture",
    },
  },
  housewarming: {
    description: [
      "Our Griha Pravesam started before sunrise, and the team was there before the priest. They captured the cow entering the house, the milk boiling over and every relative who came to bless us.",
      "We now have a beautiful record of the day we moved into our dream home.",
    ],
    names: "The Krishnan family",
    loved: [5, 2, 4, 1, 6],
    date: "April 2025",
    place: "Madurai",
    cover: {
      alt: "Smiling woman holding a decorated kalash at the front door of a new home",
      stock: "RDNE Stock project, Pexels",
    },
  },
  "60th-80th-wedding": {
    description: [
      "Our parents' 60th wedding brought four generations together, and the team made sure every family group was photographed. They were so patient with the elders.",
      "The photo of Appa tying the thali again, with all the grandchildren around them, is now in every one of our homes.",
    ],
    names: "Sundaram & Kamala",
    loved: [1, 3, 5, 2, 4],
    date: "February 2025",
    place: "Karaikudi",
    cover: {
      alt: "Elderly couple in silk and flower garlands holding hands at their wedding celebration",
      stock: "Mouli Ghosh, Pexels",
    },
  },
  "family-portraits": {
    description: [
      "Getting three generations into one frame, all smiling, felt impossible. The team made it fun with jokes and games, and the children loved them.",
      "We finally have a family portrait we are proud to hang in the living room.",
    ],
    names: "The Rajendran family",
    loved: [2, 5, 1, 6, 3],
    date: "December 2024",
    place: "Madurai",
    cover: {
      alt: "Three generations of a family in traditional clothes posing outdoors",
      stock: "the Amritdev, Pexels",
    },
  },
  // ── Portraits ──
  "personal-portraits": {
    description: [
      "I had never had professional portraits taken and felt awkward in front of the camera. The team gently showed me how to stand and where to look, and soon I forgot the camera was there.",
      "The photos feel like the best version of me, without looking edited.",
    ],
    names: "Anitha",
    date: "March 2025",
    place: "Madurai",
    cover: {
      alt: "Woman in a grey and gold silk saree with temple jewellery and jasmine",
      stock: "Sabesh Photography, Unsplash",
    },
  },
  "model-portfolio": {
    description: [
      "I needed a portfolio for my first agency submissions, and the team planned three looks, in the studio and outdoors, in a single day. They knew exactly what agencies look for.",
      "Within a month of sending the photos, I had my first booking.",
    ],
    names: "Shalini",
    date: "July 2025",
    place: "Chennai",
    cover: {
      alt: "Model in a yellow blazer crouching among the arched columns of a palace",
      stock: "Anil Sharma, Pexels",
    },
  },
  graduation: {
    description: [
      "Graduation day was busy and emotional, and the team captured both. They caught my parents' faces when my name was called and the cap toss with my friends.",
      "We also took a few calm portraits around the campus, which my family loves.",
    ],
    names: "Nivetha",
    date: "May 2025",
    place: "Madurai",
    cover: {
      alt: "Smiling graduate in cap and gown holding her degree certificate",
      stock: "Mushtaq Hussain, Pexels",
    },
  },
  headshots: {
    description: [
      "I needed headshots for LinkedIn and our company website, and the session took less than an hour. The team helped with what to wear and set up the lighting perfectly.",
      "I finally look professional and approachable at the same time, and three of my colleagues booked them next.",
    ],
    names: "Arvind",
    date: "April 2025",
    place: "Madurai",
    cover: {
      alt: "Bearded man in a navy suit against a plain grey backdrop",
      stock: "Abhishek, Pexels",
    },
  },
  // ── Events ──
  "corporate-events": {
    description: [
      "Our annual meet had talks, awards and a dinner, and the team covered all of it without disturbing a single session. They were discreet and very well organised.",
      "We had edited highlights the next morning for our social media, and the full set within the week.",
    ],
    names: "Annual Leadership Meet",
    loved: [5, 2, 4, 1, 6],
    date: "January 2025",
    place: "Madurai",
    cover: {
      alt: "Speaker addressing an audience at a corporate event",
      stock: "Fahad Puthawala, Pexels",
    },
  },
  "stage-shows": {
    description: [
      "Stage lighting is hard to photograph, but the team handled it beautifully. Every artist has sharp, glowing photos from the middle of their performance.",
      "They also captured the audience and the moments backstage, which made our programme booklet special.",
    ],
    names: "Margazhi Music Evening",
    loved: [3, 6, 2, 5, 1],
    date: "December 2024",
    place: "Madurai",
    cover: {
      alt: "Sitar player alone on a dark stage under a single spotlight",
      stock: "Anurag Sarkar, Pexels",
    },
  },
  "school-college": {
    description: [
      "Our school annual day had more than thirty performances, and the team made sure every class was photographed on stage. Parents were thrilled to receive photos of their children.",
      "They were organised, friendly with the students and delivered everything on time.",
    ],
    names: "Annual Day Celebrations",
    date: "February 2025",
    place: "Madurai",
    cover: {
      alt: "Schoolchildren in costume and uniform waiting to perform at a school cultural event",
      stock: "Suresh Photography, Pexels",
    },
  },
};
