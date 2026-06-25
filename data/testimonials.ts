// Student & client testimonials for Attique Bhatti. Featured quotes are
// transcribed verbatim from the collected feedback (LinkedIn posts + course
// reviews); the gallery shows the original screenshots as verifiable proof.

export interface Testimonial {
  name: string;
  quote: string;
  source: string;
  course: string;
  rating: number;
}

export const FEATURED_TESTIMONIALS: Testimonial[] = [
  {
    name: 'Reuel Tay',
    quote:
      'Huge appreciation to my instructor Attique Bhatti for pushing us beyond theory and into true engineering conversations, and to the cohort for the sharp questions and collaborative energy. This was a high-impact week of growth.',
    source: 'LinkedIn',
    course: 'Prisma SD-WAN Design & Operation — Dubai',
    rating: 5,
  },
  {
    name: 'Yusuf Buhari',
    quote:
      'I want to sincerely appreciate Mr. Attique Bhatti for being an outstanding training instructor. His deep knowledge, engaging teaching style, and patience made the entire learning experience not only valuable but truly enjoyable. His ability to simplify complex concepts made a lasting impact.',
    source: 'Course Review',
    course: 'Prisma SD-WAN',
    rating: 5,
  },
  {
    name: 'Nathaniel Hammond',
    quote:
      'The training took me from very little knowledge of SD-WAN to a level where I can speak to the subject matter, spin labs, test and troubleshoot issues. Attique Bhatti, the instructor, has done a wonderful job — I want to say thank you.',
    source: 'Course Review',
    course: 'Prisma SD-WAN',
    rating: 5,
  },
  {
    name: 'Louis Yelfari',
    quote:
      'Very insightful and educative training, worth the money. The environment, content, delivery and labs were top notch. The instructor (Attique Bhatti) did a very good job delivering the training, guiding us through the labs, and answering very complex questions about various implementation approaches.',
    source: 'Course Review',
    course: 'Prisma SD-WAN',
    rating: 5,
  },
  {
    name: 'John Mensah',
    quote:
      'Training was very insightful and engaging. It was delivered seamlessly and simplified to my understanding. Plus, having high-quality materials and hands-on labs made a huge difference; it really helped solidify how everything works in a real-world scenario.',
    source: 'Course Review',
    course: 'Prisma SD-WAN',
    rating: 5,
  },
  {
    name: 'Isaac Boateng',
    quote:
      'Prisma SD-WAN training carried out by Attique Bhatti was very technical, insightful and met my expectations.',
    source: 'Course Review',
    course: 'Prisma SD-WAN',
    rating: 5,
  },
  {
    name: 'Sisan Ebiyon',
    quote:
      "I'm genuinely glad the training was educative and insightful, and will strongly support the deployment of Prisma SD-WAN in my company.",
    source: 'Course Review',
    course: 'Prisma SD-WAN',
    rating: 5,
  },
  {
    name: 'Yohan Odonkor',
    quote:
      'An excellent training session delivered by Attique Bhatti. The content was clear, concise and well-structured, with the right level of depth to make complex topics easy to understand. He takes the time to thoroughly explain each concept and ensures every question is answered with clarity and patience. A very well-delivered session and absolutely worth the investment.',
    source: 'Google Review',
    course: 'Palo Alto Networks',
    rating: 5,
  },
  {
    name: 'Olufemi Oluyomi',
    quote:
      'Attique Bhatti is a wonderful teacher who masters the art of translation: turning complex Palo Alto information into an amazing and understandable learning journey. I entered with zero hands-on knowledge of Palo Alto firewalls, despite my background with Checkpoint, FTD, ASA and FortiGate — and I am now leaving with the confidence and practical knowledge to use them effectively in my job. A fantastic course led by a true expert!',
    source: 'Google Review',
    course: 'Palo Alto Networks Firewall',
    rating: 5,
  },
  {
    name: 'Joseph Ikpeme',
    quote:
      'The instructor (Attique Bhatti) was exceptionally knowledgeable of the subject matter, and very engaging. The best training I have attended so far. Kudos for this Palo Alto training and the wonderful instructor.',
    source: 'Google Review',
    course: 'Palo Alto Networks — Dubai',
    rating: 5,
  },
  {
    name: 'Ashish Kumar',
    quote:
      'I have successfully completed the Palo Alto Networks EDU-210 training. The sessions were conducted by Mr. Attique Bhatti, whose exceptional subject matter expertise and outstanding presentation skills greatly enhanced the learning.',
    source: 'Google Review',
    course: 'Palo Alto Networks EDU-210',
    rating: 5,
  },
  {
    name: 'N. Narang',
    quote:
      'I recently completed the Palo Alto EU210 course, taught by Attique, and I am thoroughly impressed with the quality of the training provided. As someone relatively new to the subject, I found the course content to be exceptionally well-organized and relevant to real-world applications.',
    source: 'Course Review',
    course: 'Palo Alto Networks EDU-210',
    rating: 5,
  },
  {
    name: 'Manoj Kumar',
    quote:
      'Mr. Attique Bhatti has in-depth knowledge of security products and next-gen technologies. He is a good instructor and quite expressive during training.',
    source: 'Google Review',
    course: 'Palo Alto Networks',
    rating: 5,
  },
];

// Original feedback screenshots (LinkedIn recommendations + review platforms).
export const TESTIMONIAL_IMAGES: string[] = Array.from(
  { length: 50 },
  (_, i) => `/testimonials/image${i + 1}.png`
);
