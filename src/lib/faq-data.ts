export type FaqListItem = string | { text: string; emphasize: true } | { text: string; sublist: string[] };

export type FaqBlock = { type: "p"; text: string } | { type: "ul"; items: FaqListItem[] };

export type FaqQuestion = { question: string; blocks: FaqBlock[] };

export type FaqCategory = { title: string; questions: FaqQuestion[] };

function p(text: string): FaqBlock {
  return { type: "p", text };
}

function ul(items: FaqListItem[]): FaqBlock {
  return { type: "ul", items };
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    title: "Expenses & Timekeeping",
    questions: [
      {
        question: "What can I expense?",
        blocks: [
          p("You can expense:"),
          ul([
            "Your flight",
            "Transportation to/from the airport or airport parking, both from your home and at the summit destination",
            "Any transportation needed during the summit",
            "Food needed while traveling or at the summit",
          ]),
          p("A few things to keep in mind:"),
          ul([
            {
              text: "Expenses on you:",
              sublist: [
                "Minibar snacks, in-room movies, and spa treatments",
                "Sightseeing and side trips",
                "If you bring a partner, friend, or family member, their costs (unless specifically stated otherwise)",
              ],
            },
            "Book economy for flights, check with your manager first before upgrading",
          ]),
          p("In Expensify, use the following:"),
          ul([
            'Expense category: "Internal Travel - (meals, ground transportation etc)"',
            'Customer/Project: "Internal:2026 Q3 All Hands"',
            'Uncheck "Billable," leave "Reimbursable" checked',
            "Anything over $75 needs a receipt",
            "If you shared a ride or split any costs with someone else, note that in the expense description",
          ]),
          p("Have a question that's not covered here? Ask your manager."),
        ],
      },
      {
        question: "Can I buy flights from a different beginning or final destination?",
        blocks: [
          p(
            "Yes. Your flight can start and end in two different locations if you're traveling from somewhere other than home before or after the summit, and it can be on different dates too if you want to arrive or leave earlier or later, **as long as the cost is comparable**. For example, if you live in NYC but happen to be in Denver beforehand and need to visit family in Tampa afterward, flying Denver to Mexico City to Tampa is fine.",
          ),
        ],
      },
      {
        question: "How should I log my time in Kantata for the Summit?",
        blocks: [
          p(
            'Use the Mavenlink project "Internal - Q1 2027 Joint Summit" and log your hours there for any time you\'re at the Summit, including your travel time to and from the event.',
          ),
          p("If you don't see the project:"),
          ul([
            'Click "Projects" on the left-hand side',
            'Set the filter to "Joinable Projects"',
            'Search "Q1"',
            'Click the blue "Join" button',
          ]),
          p(
            "(The project name follows the same pattern for each summit, so check for the matching quarter and year if this changes in the future.)",
          ),
        ],
      },
    ],
  },
  {
    title: "Event Details",
    questions: [
      {
        question: "What's the dress code?",
        blocks: [
          p("The usual is:"),
          ul(["Happy Hour: Casual", "All Hands Summit: Business casual", "Dinner: A bit more than casual, a bit less than dressy"]),
          p("If anything changes, we'll send updated info a few weeks before the summit."),
        ],
      },
      {
        question: "When should I arrive and leave?",
        blocks: [
          p("The summit runs from Happy Hour on day one through breakfast on day three."),
          ul([
            {
              text: "Arrival: Happy Hour is usually around 6 to 7pm on the first day, plan to arrive in time to make it to that.",
              emphasize: true,
            },
            "Departure: There are no events the day after the summit ends, so you're free to leave whenever works for you. Some people head home early that morning, others stay through the weekend to explore the city.",
          ]),
        ],
      },
      {
        question: "Is there space to step out for calls?",
        blocks: [
          p(
            "We don't book additional rooms or spaces for taking meetings. If the general spaces around the hotel are too busy or loud, we'd suggest taking your call from your room instead.",
          ),
        ],
      },
    ],
  },
  {
    title: "Managing Your Booking",
    questions: [
      {
        question: "What if I need to change my flight or room after I submit?",
        blocks: [
          p(
            'No problem, just use the personal link we emailed you after you first submitted. You can update your dates, flight info, room, or guests anytime, no need to fill out the form again or email us. If you\'ve lost that link, just fill in the "get started" section with your info again and we\'ll email it back to you.',
          ),
        ],
      },
      {
        question: "Is there a group rate if I want to extend my stay for personal travel afterward?",
        blocks: [
          p(
            "Yes, just add the extra nights and pick a room type on the booking form. Keep in mind the discounted group rate only applies from Jan 16 to Jan 26, nights outside that window may be priced differently.",
          ),
        ],
      },
      {
        question: "Who do I contact if something's wrong with my hotel reservation once I check in?",
        blocks: [
          p(
            "First, double check the info you originally submitted on the form is correct. If it is, and the reservation itself is wrong, Slack Dani V if you're in LATAM, or Zahra if you're in NA.",
          ),
        ],
      },
    ],
  },
  {
    title: "Travel Documents & Money",
    questions: [
      {
        question: "Do I need a visa or any travel documents for Mexico?",
        blocks: [
          p(
            "If you're a citizen of the US, Canada, Colombia, or Ireland, you don't need a visa to enter Mexico for tourism (stays under 180 days). You'll just need a valid passport. Requirements can vary by individual situation, so if anything about your travel is unusual, double check with your country's Mexican consulate.",
          ),
          p(
            "If you'd like to make things easier at customs and immigration, it can help to have printed copies of your return flight, your hotel reservation, and a letter explaining the reason for your stay, Dani V can provide that letter if you need one.",
          ),
        ],
      },
      {
        question: "Do I need a passport?",
        blocks: [
          p(
            "Yes, everyone needs a valid passport to enter Mexico, regardless of nationality. It's a good idea to make sure yours is valid for at least 6 months beyond your travel dates, and to check that it isn't set to expire soon.",
          ),
        ],
      },
      {
        question: "What's the currency, and do I need to exchange money?",
        blocks: [
          p(
            "Mexico uses the Mexican peso (MXN). Most hotels and restaurants in the area accept credit cards, but it's a good idea to carry a bit of cash for smaller purchases or tips. You don't need to exchange money before you arrive, ATMs and currency exchange are both widely available.",
          ),
        ],
      },
    ],
  },
  {
    title: "Family & Guests",
    questions: [
      {
        question: "Can I bring my kids/family, and are they included in any events?",
        blocks: [
          p(
            "You're welcome to bring family along and add them as a guest in your room (see the additional guest details above for costs). For the Mexico City summit, family members are able to join the Happy Hour and Dinner.",
          ),
        ],
      },
    ],
  },
  {
    title: "Attendance & Schedule Changes",
    questions: [
      {
        question: "How should I balance in-person time with client commitments?",
        blocks: [
          p(
            "We would love full participation in summit events but recognize that they may conflict with client commitments. It is common for Cuestans to come in and out of sessions to participate in client meetings.",
          ),
        ],
      },
      {
        question: "What if my schedule changes, or I get sick?",
        blocks: [
          p(
            "Update the form with the new information. Add any details you think we should know in the comments section, the planning team will be notified.",
          ),
        ],
      },
      {
        question: "What should I expect if I can't go?",
        blocks: [
          p(
            "We'll try to set up a Teams meeting during the session so you can join remotely, but that doesn't always work out so please bear with us.",
          ),
        ],
      },
    ],
  },
];
