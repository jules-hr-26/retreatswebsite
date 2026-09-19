
function filterEvs(el, type) {
  document.querySelectorAll('.ev-filter').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
  el.classList.add('active');
  el.setAttribute('aria-pressed', 'true');
  const todayStr = new Date().toISOString().slice(0, 10);
  document.querySelectorAll('.ev-item[data-type]').forEach(item => {
    const ts = item.dataset.ts;
    const isUpcoming = !ts || ts >= todayStr;
    item.style.display = (isUpcoming && (type === 'all' || item.dataset.type === type)) ? 'flex' : 'none';
  });
}

// Hide past events on initial page load
(function() {
  var d = new Date().toISOString().slice(0, 10);
  document.querySelectorAll('.ev-item[data-type]').forEach(function(item) {
    if (item.dataset.ts && item.dataset.ts < d) item.style.display = 'none';
  });
})();

function show(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(a => { a.classList.remove('active'); a.removeAttribute('aria-current'); });
  document.getElementById('page-' + page).classList.add('active');
  document.getElementById('nav-' + page).classList.add('active');
  document.getElementById('nav-' + page).setAttribute('aria-current', 'page');
  window.scrollTo(0,0);
  if (page === 'bulletin') loadForum();
  if (page === 'events') loadClimateEvents();
  if (page === 'directory') loadDirectory();
}
function selectRetreat(el, id, type) {
  // Clear all cohort card actives
  document.querySelectorAll('.cohort-card').forEach(c => c.classList.remove('active'));
  // Clear all timeline item actives
  document.querySelectorAll('.tl-item').forEach(c => c.classList.remove('tl-active'));
  // Set active on clicked element
  if (type === 'cohort') el.classList.add('active');
  if (type === 'tl') el.classList.add('tl-active');
  // Hide all retreat content sections
  document.querySelectorAll('.retreat-content').forEach(c => c.style.display = 'none');
  // Show selected
  const target = document.getElementById('rc-' + id);
  if (target) {
    target.style.display = 'block';
    // Smooth scroll to content
    setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }
}
// Resource Library — detail content shown in the shared resource-modal.
// Full copyrighted texts (e.g. Plum Village teachings) are summarized here,
// not reproduced in full, with a source link to the original.
const RESOURCE_CONTENT = {
  'five-mindfulness-trainings': {
    kicker: 'Foundational practices · Teaching',
    title: 'The Five Mindfulness Trainings',
    body: `
      <p>Thich Nhat Hanh described the Five Mindfulness Trainings as "one of the most concrete ways to practice mindfulness" — a modern rendering of the Buddha's Five Precepts for everyday life, addressing how we protect life, share resources, love, speak and listen, and consume.</p>
      <h4>1. Reverence for Life</h4>
      <p>A commitment to protecting the lives of people, animals, plants, and minerals — cultivating the insight of interbeing and working to transform the roots of violence: anger, fear, greed, and intolerance.</p>
      <h4>2. True Happiness</h4>
      <p>A commitment to generosity and against exploitation, recognizing that "true happiness is not possible without understanding and compassion," and to a livelihood that reduces suffering for other beings and the planet.</p>
      <h4>3. True Love</h4>
      <p>A commitment to sexual responsibility grounded in "mutual consent, true love, and a deep, long-term commitment" — protecting individuals, couples, families, and children, while respecting differing gender identities and orientations.</p>
      <h4>4. Loving Speech and Deep Listening</h4>
      <p>A commitment to speaking truthfully and listening compassionately, including the discipline to stay silent when anger is present, so words and listening help rather than harm.</p>
      <h4>5. Nourishment and Healing</h4>
      <p>A commitment to mindful consumption — of food, media, and company — avoiding what carries toxins into body and mind, and choosing what nourishes peace, joy, and well-being.</p>
    `,
    sourceUrl: 'https://plumvillage.org/mindfulness/the-5-mindfulness-trainings',
    sourceLabel: 'Plum Village',
  },
  'fourteen-mindfulness-trainings': {
    kicker: 'Foundational practices · Teaching',
    title: 'The Fourteen Mindfulness Trainings',
    body: `
      <p>Created by Thich Nhat Hanh in 1966, the Fourteen Mindfulness Trainings are a modern distillation of the traditional Bodhisattva precepts of Mahayana Buddhism. Monastics and lay practitioners who formally commit to observing them become members of the Order of Interbeing, a global community spanning every continent.</p>
      <p>The fourteen trainings are:</p>
      <ol>
        <li>Openness</li>
        <li>Non-attachment to Views</li>
        <li>Freedom of Thought</li>
        <li>Awareness of Suffering</li>
        <li>Compassionate, Healthy Living</li>
        <li>Taking Care of Anger</li>
        <li>Dwelling Happily in the Present Moment</li>
        <li>True Community and Communication</li>
        <li>Truthful and Loving Speech</li>
        <li>Protecting and Nourishing the Sangha</li>
        <li>Right Livelihood</li>
        <li>Reverence for Life</li>
        <li>Generosity</li>
        <li>True Love</li>
      </ol>
    `,
    sourceUrl: 'https://plumvillage.org/mindfulness/the-14-mindfulness-trainings',
    sourceLabel: 'Plum Village',
  },
  'beginning-anew': {
    kicker: 'Foundational practices · Practice',
    title: 'Beginning Anew',
    body: `
      <img src="/images/resources/beginning-anew.jpg" alt="Beginning Anew practice">
      <p>Beginning Anew is Sister Chân Không and Thich Nhat Hanh's four-part practice for healing and restoring relationships — clearing misunderstandings before they harden, through honest speech and compassionate listening.</p>
      <h4>1. Flower Watering</h4>
      <p>Sharing specific appreciation — a moment the other person said or did something we admired.</p>
      <h4>2. Expressing Regret</h4>
      <p>Naming, without excuse, something we said or did that we haven't yet had the chance to apologize for.</p>
      <h4>3. Expressing Hurt</h4>
      <p>Sharing, gently and honestly, how a specific interaction left us feeling hurt.</p>
      <h4>4. Sharing a Long-Term Difficulty and Asking for Support</h4>
      <p>Naming an older pain that keeps resurfacing, so the people around us can understand it and offer real support.</p>
    `,
    sourceUrl: 'https://plumvillage.org/articles/begin-anew',
    sourceLabel: 'Plum Village',
  },
  'contemplations-before-eating': {
    kicker: 'Foundational practices · Practice',
    title: 'Contemplations Before Eating',
    body: `
      <p>In the Plum Village tradition, these five lines are recited silently — or aloud, one line each — before meals, a brief pause to eat with more awareness of where our food comes from and what our eating affects.</p>
      <ol>
        <li>"This food is a gift of the earth, the sky, numerous living beings, and much hard and loving work."</li>
        <li>"May we eat with mindfulness and gratitude so as to be worthy to receive this food."</li>
        <li>"May we recognize and transform unwholesome mental formations, especially our greed, and learn to eat with moderation."</li>
        <li>"May we keep our compassion alive by eating in such a way that reduces the suffering of living beings, stops contributing to climate change, and heals and preserves our precious planet."</li>
        <li>"We accept this food so that we may nurture our brotherhood and sisterhood, build our sangha, and nourish our ideal of serving all living beings."</li>
      </ol>
    `,
    sourceUrl: 'https://plumvillage.org/articles/news/new-contemplations-before-eating',
    sourceLabel: 'Plum Village',
  },
  'gathering-tea': {
    kicker: 'Gathering idea · 30–60 min · any size',
    title: 'Tea meditation',
    body: `
      <p>One of the simplest and most intimate formats — slowing down together around a shared pot. No agenda, no talking points, just warmth and presence.</p>
      <h4>What you'll need</h4>
      <p>Tea, cups, a low table or cloth, a bell. Optional: a candle, a small flower.</p>
      <h4>How to run it</h4>
      <ol>
        <li>Arrange cups and a teapot in the centre. Invite everyone to sit in a circle and settle into two minutes of silence.</li>
        <li>Pour slowly and mindfully. The host moves without speaking; guests receive with both hands.</li>
        <li>Drink together in silence for 10–15 minutes — notice the warmth, smell, taste.</li>
        <li>After the bell, open space for sharing. One or two sentences each; no need to fill the silence.</li>
      </ol>
    `,
  },
  'gathering-walk': {
    kicker: 'Gathering idea · 45–90 min · any size',
    title: 'Walking meditation',
    body: `
      <p>Walking meditation turns an ordinary path into practice — coordinating breath and footsteps, arriving with each step rather than moving toward a destination.</p>
      <h4>What you'll need</h4>
      <p>A path — natural or urban. Loose, comfortable shoes. A bell to begin and end.</p>
      <h4>How to run it</h4>
      <ol>
        <li>Gather in silence. Invite a brief settling — stand still, feel the ground under your feet.</li>
        <li>Begin walking at half your normal pace. Coordinate breath and steps: in for two steps, out for two.</li>
        <li>Walk in a loose line or spread out. No talking — just arriving in each footstep.</li>
        <li>After 30–40 minutes, stop together. A moment of stillness before opening for sharing.</li>
      </ol>
    `,
  },
  'gathering-hike': {
    kicker: 'Gathering idea · 2–4 hrs · up to 20',
    title: 'Mindful hike',
    body: `
      <p>A hike that moves at the pace of the slowest breath rather than the fastest walker — pausing often, noticing what's around and inside.</p>
      <h4>What you'll need</h4>
      <p>A trail, comfortable footwear, water. A bell or small chime for rest stops.</p>
      <h4>How to run it</h4>
      <ol>
        <li>Start with five minutes of stillness at the trailhead — feel the air, listen to what's around you.</li>
        <li>Walk in noble silence for the first 20–30 minutes. Let the body settle into the pace.</li>
        <li>Choose two or three rest stops along the route. At each one, one minute of standing silence before brief sharing.</li>
        <li>Close at the summit or a natural resting point — the five contemplations, or simply sitting together in quiet.</li>
      </ol>
    `,
  },
  'gathering-forest': {
    kicker: 'Gathering idea · 2–4 hrs · up to 20',
    title: 'Forest bathing',
    body: `
      <p><em>Shinrin-yoku</em> — Japanese for "forest bathing" — is not a hike. It's an invitation to be absorbed by the forest rather than to move through it. There is nowhere to get to.</p>
      <h4>What you'll need</h4>
      <p>A wooded area. Loose, comfortable clothes. A blanket or mat for sitting.</p>
      <h4>How to run it</h4>
      <ol>
        <li>Open with an invitation: "Move slowly. There is nowhere to get to." Begin walking with no destination.</li>
        <li>Offer quiet invitations spaced through the walk: "Notice what's moving." "What does the air feel like on your skin?" "Let your eyes soften."</li>
        <li>Find a place to sit together for 15–20 minutes. No journaling, no phones — just staying with what is.</li>
        <li>Close with a simple sharing circle: one word or image that stays with you from the forest.</li>
      </ol>
    `,
  },
  'gathering-meal': {
    kicker: 'Gathering idea · 45–60 min · any size',
    title: 'Silent meal',
    body: `
      <p>Eating in silence together shifts a meal from a social event to a shared practice — noticing taste, texture, and the web of labour and care that brought the food to the table.</p>
      <h4>What you'll need</h4>
      <p>A prepared meal, table, bell. The five contemplations printed or read aloud before eating.</p>
      <h4>How to run it</h4>
      <ol>
        <li>Before serving, recite the five contemplations together — aloud, one line per person in the circle.</li>
        <li>Eat in silence. The host rings the bell once to begin and once to close.</li>
        <li>After the bell, allow a natural transition — no rush to fill the quiet immediately.</li>
        <li>Close with a brief sharing: what did you notice? One or two sentences each.</li>
      </ol>
    `,
    sourceUrl: null,
  },
  'gathering-day': {
    kicker: 'Gathering idea · Full day · up to 30',
    title: 'Day of mindfulness',
    body: `
      <p>The full Plum Village format — a day structured around alternating periods of sitting, walking, eating, and sharing, with noble silence woven throughout. One of the deepest containers the community can offer itself.</p>
      <h4>What you'll need</h4>
      <p>A space with a room for sitting and an outdoor area. Simple food for a shared meal. A bell. A facilitator pair.</p>
      <h4>A suggested arc</h4>
      <ol>
        <li><strong>Morning:</strong> Sitting meditation (30–45 min), then walking meditation outdoors.</li>
        <li><strong>Midday:</strong> Mindful meal — five contemplations before eating, noble silence during.</li>
        <li><strong>Afternoon:</strong> Rest or free walking, then dharma sharing circle with one or two offered questions.</li>
        <li><strong>Close:</strong> Songs or chants together, a short final sitting, and a few words of loving farewell.</li>
      </ol>
      <p>Noble silence is observed from arrival through the end of the morning session. After lunch, conversation is welcome — the practice continues in how people speak and listen.</p>
    `,
  },
  'start-a-sangha': {
    kicker: 'Community & sangha · Practice',
    title: 'How to Start Your Own Sangha',
    body: `
      <p>You don't need to be a teacher or a monastic to start a sangha — just the aspiration to practice with others. Begin with two or three friends in someone's living room; traditionally four is considered a sangha, and Thich Nhat Hanh suggested five as a good minimum.</p>
      <p>Weekday evenings or weekend daytimes, meeting weekly or fortnightly, tend to work best. A typical session includes sitting meditation, walking meditation or mindful movement, and closes with tea or a shared meal.</p>
      <h4>Facilitating</h4>
      <p>Every meeting needs a facilitator to hold the space and coordinate the stages of the session. It's best held by two people together, rotating who leads each time, so the responsibility — and the learning — is shared.</p>
    `,
    sourceUrl: 'https://plumvillage.app/a-short-guide-to-joining-or-starting-a-sangha/',
    sourceLabel: 'Plum Village',
  },
  'airport-meditation': {
    kicker: 'Practice · For: The journey home from retreat · No extra time required',
    title: 'Walking Meditation in Transit',
    body: `
      <img src="/images/resources/airport-meditation-1.jpg" alt="Airport terminal">
      <p class="photo-credit">Photo: Jue Huang / Unsplash</p>
      <p><em>The first time I left a retreat, I lost it in a security line. The second time, my suitcase came apart on the baggage carousel — and I was calm. That was the moment I understood what we had actually been doing.</em></p>
      <h4>As you leave your room</h4>
      <p>In sitting meditation, we know when we are breathing a long breath and when we are breathing a short one. We do not change the breath. We simply know it.</p>
      <p>Bring that same knowing to the journey. One in-breath, one out-breath at the door. See yourself moving through the day ahead — the hallway, the terminal, the aisle of the plane. Peace is available in each of those steps.</p>
      <blockquote><em>Breathing in, I have arrived.<br>Breathing out, I am home.</em></blockquote>
      <p>Then open the door.</p>
      <h4>Stage One — Room to shuttle</h4>
      <p>This stretch looks like logistics. It is where the retreat is most quietly at risk.</p>
      <p>Let your steps and your breath find each other — perhaps two or three steps breathing in, three or four breathing out. Don't manufacture a rhythm; let the body offer one. The suitcase comes too: the handle in the hand, the wheels on gravel. Nothing needs to be added.</p>
      <p>The planning mind will arrive. Notice it. Smile at it. Come back to the step.</p>
      <p><em>Sati</em> — the word we translate as mindfulness — means remembering. Coming back. This coming back isn't a sign the practice is failing. It is the practice.</p>
      <h4>Stage Two — The seatbelt</h4>
      <p>The shuttle, the taxi, the car. Thay taught that mindful breathing is the seatbelt of life. We fasten it because we're traveling in conditions we didn't make — the weather, the other drivers, our own distraction.</p>
      <p>As the belt clicks, one conscious breath. Let the sound be your bell.</p>
      <blockquote><em>Breathing in, I am safe.<br>Breathing out, I am here.</em></blockquote>
      <h4>Stage Three — Waiting</h4>
      <img src="/images/resources/airport-meditation-2.jpg" alt="Waiting at the gate">
      <p class="photo-credit">Photo: Marco Lopez / Unsplash</p>
      <p>Security. Boarding. Baggage claim. Takeoff.</p>
      <p>When the line is moving: each shuffle forward, one full breath. When the line stops, it's standing meditation. When it moves, it's walking meditation. No gap between them — and no one can tell.</p>
      <blockquote><em>This step, I have arrived.<br>This step, I am home.</em></blockquote>
      <p>When nothing is moving — a delay, a carousel, a runway — sit and breathe. There is genuinely nowhere to go and nothing to do. We spend a great deal of money manufacturing that condition at retreat centers. It's being offered free at Gate 14.</p>
      <h4>When you have to run</h4>
      <p>Sometimes the gate changes and you sprint. This isn't a failure of practice. Walking meditation was never about walking slowly — it's about walking, or occasionally sprinting past duty-free with a bag on one shoulder, knowing that you are doing it. Your intention travels at whatever speed you do.</p>
      <p><em>Peace is every step. Including the fast ones.</em></p>
      <h4>Practice together</h4>
      <p>Traveling with other alumni? Invite the bell from the Plum Village app — in the car, in the terminal, on the plane. Everyone stops talking and breathes for three breaths. Fifteen seconds. It turns a departure into a sangha.</p>
      <p>Alone? The soles of your feet are the bell. The floor is always there.</p>
      <h4>When it falls apart</h4>
      <p>You'll reach the gate and realize you never walked once. The recovery is not guilt. The recovery is the next step — literally the next one. Practice carries no accumulated debt.</p>
      <h4>Why this matters back at work</h4>
      <p>What we rehearse in transit isn't calm. It's the capacity to be fully present in conditions we didn't choose — which is, more or less, the entire job description.</p>
      <p>Every unremarkable step waters a seed. When the crisis comes, we don't reach for calm — the seed we've watered rises on its own, and carries us.</p>
      <p><em>We don't summon our calm in a crisis. We discover what we've been growing.</em></p>
    `,
    sourceHtml: 'Leslie Hubbard (Sister Suchness) · OLEL Leadership',
  },
  'breathing-corner': {
    kicker: 'Practice · For: Returning home from retreat',
    title: 'Setting Up a Breathing Corner',
    body: `
      <img src="/images/resources/breathing-corner.jpg" alt="A breathing corner">
      <p>In his book <em>Happiness</em>, Thich Nhat Hanh writes about how we can create a room or corner in our home where we can sit, breathe, and meditate.</p>
      <blockquote><em>Every house should have a room called the Breathing Room, or at least a corner of a room reserved for this purpose. In this place we can put a low table with a flower, a little bell, and enough cushions for everyone in the family to sit on. When we feel uneasy, sad, or angry, we can go into this room, close the door, sit down, invite a sound of the bell, and practice breathing mindfully. When we have breathed like this for ten or fifteen minutes, we begin to feel better.</em></blockquote>
      <p>On one summer retreat at Plum Village, Thay asked a young boy: "My child, when your father speaks in anger, do you have any way to help your father?" The child shook his head: "I do not know what to do. I become very scared and try to run away." Thay told him: "You can invite your parents into your Breathing Room to breathe with you."</p>
      <h4>Making an agreement</h4>
      <p>A Breathing Corner is something a family must agree about in advance — when everyone is feeling happy. You could say: "Sometimes we are angry, and we say hurtful things to each other. Next time this happens, we will go into the Breathing Room and invite the sound of the bell to remind us all to breathe."</p>
      <p>Once you have gone into the Breathing Room, everyone in the family can commit: "When we hear the sound of the bell, everyone in the house will stop and breathe. No one will continue to shout after that." This is called <em>The Agreement on Living Together in Peace and Joy.</em></p>
      <p>If you can bring this home, after about three months you will feel that the atmosphere in the family has become much more pleasant. The wounds in the hearts of the children will be soothed, and gradually they will heal.</p>
      <h4>What you need</h4>
      <p>A low table. A flower. A bell. Cushions for each person in the family.</p>
      <p>That is all.</p>
    `,
    sourceHtml: 'Deer Park Monastery · Based on <em>Happiness</em> by Thich Nhat Hanh · <a href="https://deerparkmonastery.org/journal/deepen-your-practice-the-breathing-room/" target="_blank" rel="noopener">deerparkmonastery.org</a>',
  },
  'mindful-eating': {
    kicker: 'Personal practice · Cultivation',
    title: 'Mindful Eating',
    body: `
      <p>Mindful eating means bringing our awareness to the food on our plate and in our mouth — paying full attention to the sensations of eating in the present moment. It can transform our relationship with food and is a great way to bring mindfulness into daily life.</p>

      <h4>Why try mindful eating?</h4>
      <ol>
        <li><strong>It's really enjoyable.</strong> Food is an incredibly sensuous experience: colours, textures, smell, and taste. When we eat mindfully, even simple food can feel a lot more enjoyable.</li>
        <li><strong>It helps us eat with moderation.</strong> Slowing down and savouring each mouthful gives the body time to signal fullness — we feel satisfied while eating less.</li>
        <li><strong>It helps with digestion.</strong> Mindful eating naturally leads to chewing more, which makes it easier for the body to digest food.</li>
        <li><strong>It's a great way to be mindful every day.</strong> We eat every day — making meals a practice brings mindfulness into ordinary life without extra time or equipment.</li>
        <li><strong>It grows our gratitude.</strong> Noticing the food we eat makes it easier to feel appreciation for what we already have.</li>
        <li><strong>It can be a cosmic experience.</strong> Thich Nhat Hanh taught that a piece of food is an "ambassador of the cosmos" — rain, sunshine, and a farmer's work are all present in the humble carrot on our plate.</li>
        <li><strong>We can connect with our values.</strong> When we eat mindfully, we are more aware of what we are eating and it becomes easier to naturally align with our values — around animals, the climate, or the land.</li>
      </ol>

      <h4>A step-by-step guide</h4>
      <ol>
        <li><strong>Commit to just eating.</strong> Put away devices. Even a few minutes of undivided attention to the meal will make a huge difference.</li>
        <li><strong>Stop and notice.</strong> Pause before eating. Become aware of your breathing for a breath or two, then see what you notice — the colours, shapes, and smells of the food.</li>
        <li><strong>Look a little bit deeper.</strong> How did this food arrive on your plate? Can you see the sun and rain in it? Let any gratitude that arises be present.</li>
        <li><strong>Take a mouthful, then put the fork down.</strong> Rather than preparing the next bite while chewing, rest the utensil and give full attention to the taste, texture, and sensation in your mouth. Chew a little longer than usual.</li>
        <li><strong>Bring your mind back.</strong> When the mind wanders — to errands, the next meal, anything — gently return attention to eating in the present moment. This is normal and this returning is the practice.</li>
        <li><strong>Ask: where has the food "gone"?</strong> After eating, consider how the food has literally become part of you, and will continue as energy for your future actions. Another way to see interbeing in action.</li>
        <li><strong>Be kind to yourself.</strong> It won't always be possible to eat mindfully. Our habit to eat unmindfully is a collective one, built over many years. Each moment of mindful eating is a small victory.</li>
        <li><strong>Get some support.</strong> Mindful eating is easier with others. When a group eats quietly in mindfulness, everyone acts as a reminder to everyone else — as in the silent meal at retreat.</li>
      </ol>
    `,
    sourceUrl: 'https://plumvillage.app/mindful-eating-7-reasons-to-try-it-a-step-by-step-guide/',
    sourceLabel: 'Plum Village',
  },
  'inviting-the-bell': {
    kicker: 'Community & sangha · Practice',
    title: 'Inviting the Bell',
    body: `
      <img src="/images/resources/inviting-the-bell.jpg" alt="Bell at Hollyhock retreat">
      <p>In the Plum Village tradition, we don't "strike" or "sound" the bell — we invite it. The small wooden striker used is called the bell inviter. The bell acts like a bodhisattva, calling everyone back to the present moment together.</p>
      <p>Before inviting the bell, we breathe in and out, settling the mind, and silently recite:</p>
      <p>"Body, speech, and mind in perfect oneness, I send my heart along with the sound of this bell. May the hearers awaken from their forgetfulness and transcend the path of all anxiety and sorrow."</p>
      <h4>Waking the bell</h4>
      <p>A soft, muffled touch to the rim — signaling that the full sound is coming next, so everyone has a moment to prepare before it rings.</p>
    `,
    sourceUrl: 'https://plumvillage.app/inviting-the-bell/',
    sourceLabel: 'Plum Village',
  },
  'songs-and-chants': {
    kicker: 'Community & sangha · Songs',
    title: 'Plum Village Songs and Chants',
    body: `
      <p>Twenty-two songs from the Plum Village tradition, used during retreats and community gatherings. Most can be learned by ear in a single session.</p>
      <div class="songs-grid">
        <div class="song-card">
          <div class="song-num">1</div>
          <div class="song-name">Breathing In – Breathing Out</div>
          <div class="song-text">Breathing in, breathing out,<br>Breathing in, breathing out,<br>I am blooming as a flower,<br>I am fresh as the dew.<br>I am solid as a mountain,<br>I am firm as the earth.<br>I am free.<br><br>Breathing in, breathing out,<br>Breathing in, breathing out,<br>I am water, reflecting<br>What is real, what is true.<br>And I feel there is space<br>Deep inside of me.<br>I am free, I am free, I am free.</div>
        </div>
        <div class="song-card">
          <div class="song-num">2</div>
          <div class="song-name">I Am a Cloud</div>
          <div class="song-text">I am a cloud, I am the blue sky<br>I am a bird spreading out its wings<br>I am a flower, I am the sunshine<br>I am the earth receiving a seed.<br>And I am free when my heart is open<br>Yes, I am free when my mind is clear<br>Oh dear brother, oh dear sister,<br>Let's walk together, mindfully.</div>
        </div>
        <div class="song-card">
          <div class="song-num">3</div>
          <div class="song-name">Take Your Time</div>
          <div class="song-text">Take your time –<br>breathing in, breathing out<br>Look deeply as you say "This is me!"<br><br>You and your breath, you and the air.<br>As hummingbird and flower,<br>have always been together.<br>Take gentle steps –<br>feel the ground, curl your toes<br>is there a line between you and this path?<br>You and your step, you and the earth<br>As butterfly and blossom,<br>have never been apart.</div>
        </div>
        <div class="song-card">
          <div class="song-num">4</div>
          <div class="song-name">I Have Arrived</div>
          <div class="song-text">I have arrived, I am home<br>In the here and in the now.<br>I am solid, I am free.<br>In the ultimate I dwell.<br>In the ultimate I dwell.</div>
        </div>
        <div class="song-card">
          <div class="song-num">5</div>
          <div class="song-name">In Out Deep Slow</div>
          <div class="song-text">In – out – deep – slow<br>Calm – ease, smile – release<br>Present moment – wonderful moment</div>
        </div>
        <div class="song-card">
          <div class="song-num">6</div>
          <div class="song-name">The Island Within / Taking Refuge</div>
          <div class="song-text">Breathing in I go back<br>To the island within myself.<br>There are beautiful trees within the island<br>There are clear streams of water.<br>There are birds, sunshine and fresh air.<br>Breathing out, I feel safe.<br>I enjoy going back to my island.</div>
        </div>
        <div class="song-card">
          <div class="song-num">7</div>
          <div class="song-name">No Coming No Going</div>
          <div class="song-text">No coming, no going<br>No after, no before<br>I hold you close to me<br>I release you to be so free.<br>Because I am in you and you are in me.</div>
        </div>
        <div class="song-card">
          <div class="song-num">8</div>
          <div class="song-name">Dear Friends</div>
          <div class="song-text">Dear friends, dear friends,<br>Let me tell you how I feel –<br>You have given me such treasure.<br>I love you so.<br>Love joy, inner peace<br>Like a summer morning breeze<br>Oh my dear you are so welcome<br>I love you so. I love you so.</div>
        </div>
        <div class="song-card">
          <div class="song-num">9</div>
          <div class="song-name">My Mind Is a Clear Blue Sky</div>
          <div class="song-text">My mind is a clear blue sky.<br>My mind is a clear blue sky.<br>Clouds come and clouds go<br>My mind is a clear blue sky.</div>
        </div>
        <div class="song-card">
          <div class="song-num">10</div>
          <div class="song-name">Happiness Is Here and Now</div>
          <div class="song-text">Happiness is here and now<br>I have dropped my worries.<br>Nowhere to go, nothing to do,<br>No longer in a hurry.<br><br>Happiness is here and now<br>I have dropped my worries.<br>Somewhere to go, something to do,<br>But I don't need to hurry.</div>
        </div>
        <div class="song-card">
          <div class="song-num">11</div>
          <div class="song-name">Peacefully Free</div>
          <div class="song-text">I am so free, because I can be me<br>Look at the clouds at play,<br>passing over every day<br>Inside the sky so blue,<br>immense, spacious and true<br>I'll be tall like the sky,<br>wide enough to embrace what's inside<br>Just like the clouds passing by,<br>Flying high in the grand open sky.<br><br>Because I am in you and you are in me.</div>
        </div>
        <div class="song-card">
          <div class="song-num">12</div>
          <div class="song-name">Please Call Me by My True Names</div>
          <div class="song-text">My joy's like spring so warm<br>It makes flowers bloom all over the Earth.<br>My pain's like a river of tears<br>So vast it fills the four oceans.<br>Please call me by my true names<br>So I can hear all my cries and laughter at once,<br>So I can hear that my joy and pain are one.<br>Please call me by my true names<br>So I can wake up and<br>The door of my heart could be left open.<br>The door of compassion.</div>
        </div>
        <div class="song-card">
          <div class="song-num">13</div>
          <div class="song-name">I Like the Roses</div>
          <div class="song-text">I like the roses. I like the daffodils.<br>I like the mountains. I like the rolling hills.<br>I like the twinkling stars when the sun goes down.<br>Du-bee-dee, du-bee-dee…<br>I like the rabbits, I like the squirrels too.<br>I like the bluebirds, I like the roaming moose,<br>I like all animals, all animals like me!<br>Du-bee-dee, du-bee-dee…</div>
        </div>
        <div class="song-card">
          <div class="song-num">14</div>
          <div class="song-name">When I Rise</div>
          <div class="song-text">And when I rise, let me rise<br>Like a bird, joyfully.<br>And when I fall, let me fall,<br>Like a leaf, gracefully, without regret.<br><br>And when I stand, let me stand strong and tall.<br>Like a tree, strong and tall.<br>And when I lie, let me lie,<br>Like a lake, peacefully, calm and still.<br>And when I work, let me work,<br>Like a bee, wholeheartedly.<br>And when I play, let me play,<br>Like a breeze, fresh and cool, light and clear.<br><br>Everything around me will be loved, embraced and peacefully free.<br>Everything inside me will be loved, embraced and peacefully free.</div>
        </div>
        <div class="song-card">
          <div class="song-num">15</div>
          <div class="song-name">Arrived, Arrived</div>
          <div class="song-text">Arrived, arrived<br>At home, I am at home<br>Dwelling in the here and dwelling in the now<br>Solid as a mountain, free as the white cloud.<br>The door to no birth and no death is open<br>Free and unshakeable.</div>
        </div>
        <div class="song-card">
          <div class="song-num">16</div>
          <div class="song-name">Every Little Cell</div>
          <div class="song-text">Every little cell in my body is happy<br>Every little cell in my body is well <em>(2×)</em><br>I'm so glad, every little cell<br>In my body is happy and well <em>(2×)</em></div>
        </div>
        <div class="song-card">
          <div class="song-num">17</div>
          <div class="song-name">If It's Not Love</div>
          <div class="song-text">If it's not love you can let it all go<br>Let it all go <em>(2×)</em><br>Freedom, Love is freedom <em>(2×)</em></div>
        </div>
        <div class="song-card">
          <div class="song-num">18</div>
          <div class="song-name">Jewel in a Lotus Flower</div>
          <div class="song-text">There is a jewel in the lotus flower<br>unfolding deep within my soul<br>To be a jewel in a lotus flower<br>unfolding is the highest goal<br>Om mani hum mani padme hum</div>
        </div>
        <div class="song-card">
          <div class="song-num">19</div>
          <div class="song-name">Let Life Move Me</div>
          <div class="song-text">I'm gonna let life move me deep<br>I'm gonna let life stir me deep<br>I'm gonna let life wake me from this ancient sleep<br>I'm gonna laugh all my laughter<br>I'm gonna cry all my tears<br>I'm gonna love the rain as deeply as the sun when it clears.</div>
        </div>
        <div class="song-card">
          <div class="song-num">20</div>
          <div class="song-name">Mother Earth</div>
          <div class="song-text">Mother Earth is a great big ship that we are sailing on<br>Sailing on, through space and time<br>Touch the Earth, feel your worth<br>Awake into this new rebirth<br>Open up your heart and touch the divine.</div>
        </div>
        <div class="song-card">
          <div class="song-num">21</div>
          <div class="song-name">Fill My Heart</div>
          <div class="song-text">Oh fill my heart <em>(men)</em><br>Oh fill my heart and let it overflow <em>(women)</em><br>Oh fill my heart<br>Oh fill my heart and let it overflow.<br>Oh fill my heart<br>Let it overflow with love <em>(together)</em></div>
        </div>
        <div class="song-card">
          <div class="song-num">22</div>
          <div class="song-name">Standing Like a Tree</div>
          <div class="song-text">Standing like a tree with my roots dug down,<br>My branches wide and open.<br>Come down the rain, come down the sun<br>Come down the fruits to a heart that is open<br>To be… standing like a tree.</div>
        </div>
      </div>
    `,
    sourceHtml: 'Find more Plum Village songs with music at <a href="https://plumvillage.org/library/songs" target="_blank" rel="noopener">plumvillage.org/library/songs ↗</a>',
  },
  'facilitate-a-circle': {
    kicker: 'Community & sangha · Guide',
    title: 'How to Facilitate a Circle',
    body: `
      <p>Dharma sharing is a chance to learn from each other's experience of the practice — not a discussion. A few guidelines keep the space safe and useful.</p>
      <h4>No cross-talk</h4>
      <p>Sharing goes to the whole circle, not back and forth between two people. If someone asks a question, they ask the group; if someone responds, they speak to the group.</p>
      <h4>Not too much, not too little</h4>
      <p>Speak with enough brevity that everyone in the circle has room to share.</p>
      <h4>Confidentiality</h4>
      <p>What's shared stays in the room. If someone wants to bring it up afterward, they ask the person who shared first.</p>
      <p>Toward the end, the facilitator can invite anyone who hasn't spoken to do so, and gently follow up on anything left unanswered.</p>
    `,
    sourceUrl: 'https://plumvillagesanghas.org/wp-content/uploads/2022/02/FacilitatorHandbook.pdf',
    sourceLabel: 'Plum Village — Joyful Sangha Facilitation Handbook',
  },
};

var resourceLastFocused = null;

function openResource(key) {
  var data = RESOURCE_CONTENT[key];
  if (!data) return;
  resourceLastFocused = document.activeElement;
  document.getElementById('resource-modal-kicker').textContent = data.kicker || '';
  document.getElementById('resource-modal-title').textContent = data.title || '';
  document.getElementById('resource-modal-body').innerHTML = data.body || '';
  document.getElementById('resource-modal-source').innerHTML = data.sourceHtml
    ? data.sourceHtml
    : (data.sourceUrl
      ? 'Source: <a href="' + data.sourceUrl + '" target="_blank" rel="noopener">' + (data.sourceLabel || data.sourceUrl) + ' ↗</a> — read the complete original text there.'
      : '');
  document.getElementById('resource-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', handleResourceKeydown);
  document.querySelector('#resource-modal .resource-modal-close').focus();
}
function closeResource() {
  document.getElementById('resource-modal').classList.remove('open');
  document.body.style.overflow = '';
  document.removeEventListener('keydown', handleResourceKeydown);
  if (resourceLastFocused) resourceLastFocused.focus();
}
function openStoryModal() {
  document.getElementById('story-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', handleStoryKeydown);
}
function closeStoryModal() {
  document.getElementById('story-modal').classList.remove('open');
  document.body.style.overflow = '';
  document.removeEventListener('keydown', handleStoryKeydown);
}
function handleStoryKeydown(e) {
  if (e.key === 'Escape') closeStoryModal();
}
function handleResourceKeydown(e) {
  if (e.key === 'Escape') { closeResource(); return; }
  if (e.key !== 'Tab') return;
  var modal = document.getElementById('resource-modal');
  var focusable = modal.querySelectorAll('button, a[href]');
  if (!focusable.length) return;
  var first = focusable[0], last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

var profileLastFocused = null;
var currentProfileData = null;
var profileIsFirstRun = false;

function fillProfileForm(data) {
  document.getElementById('rf-first').value = data.firstName || '';
  document.getElementById('rf-last').value = data.lastName || '';
  document.getElementById('rf-city').value = data.city || '';
  document.getElementById('rf-country').value = data.country || '';
  document.getElementById('rf-org').value = data.organization || '';
  document.getElementById('rf-sector').value = data.sector || '';
  document.getElementById('rf-role').value = data.role || '';
  document.getElementById('rf-email').value = data.displayEmail || '';

  document.getElementById('rf-optin').checked = !!data.shareWithCommunity;
  var cohorts = data.cohorts || [];
  document.querySelectorAll('#rf-cohort-grid input').forEach(function(el) {
    el.checked = cohorts.indexOf(el.value) !== -1;
  });
  updateProfilePreview();
}
function openProfile() {
  profileLastFocused = document.activeElement;
  if (currentProfileData && currentProfileData.hasProfile) fillProfileForm(currentProfileData);
  var closeBtn = document.getElementById('profile-close-btn');
  if (closeBtn) closeBtn.style.display = profileIsFirstRun ? 'none' : '';
  document.getElementById('profile-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', handleProfileKeydown);
  var firstInput = document.getElementById('rf-first');
  if (firstInput) firstInput.focus();
}
function closeProfile() {
  if (profileIsFirstRun) return;
  document.getElementById('profile-modal').classList.remove('open');
  document.body.style.overflow = '';
  document.removeEventListener('keydown', handleProfileKeydown);
  if (profileLastFocused) profileLastFocused.focus();
}
function handleProfileKeydown(e) {
  if (e.key === 'Escape') { if (!profileIsFirstRun) closeProfile(); return; }
  if (e.key !== 'Tab') return;
  var modal = document.getElementById('profile-modal');
  var focusable = modal.querySelectorAll('button, input, select, textarea, a[href]');
  if (!focusable.length) return;
  var first = focusable[0], last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

var pendingHeadshotData = '';

function previewHeadshot(input) {
  pendingHeadshotData = '';
  var file = input.files[0];
  if (!file) return;
  var preview = document.getElementById('rf-headshot-preview');
  var reader = new FileReader();
  reader.onload = function(e) {
    var img = new Image();
    img.onload = function() {
      var SIZE = 96;
      var canvas = document.createElement('canvas');
      canvas.width = SIZE; canvas.height = SIZE;
      var ctx = canvas.getContext('2d');
      var s = Math.min(img.width, img.height);
      var sx = (img.width - s) / 2;
      var sy = (img.height - s) / 2;
      ctx.drawImage(img, sx, sy, s, s, 0, 0, SIZE, SIZE);
      var dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      pendingHeadshotData = dataUrl.split(',')[1];
      if (preview) { preview.src = dataUrl; preview.style.display = 'block'; }
      var ppAvatar = document.getElementById('pp-avatar'); if (ppAvatar) { ppAvatar.innerHTML = '<img src="' + dataUrl + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%">'; }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function updateProfilePreview() {
  var first   = (document.getElementById('rf-first')   || {}).value || '';
  var last    = (document.getElementById('rf-last')    || {}).value || '';
  var role    = (document.getElementById('rf-role')    || {}).value || '';
  var org     = (document.getElementById('rf-org')     || {}).value || '';
  var city    = (document.getElementById('rf-city')    || {}).value || '';
  var country = (document.getElementById('rf-country') || {}).value || '';
  first = first.trim(); last = last.trim(); role = role.trim(); org = org.trim(); city = city.trim(); country = country.trim();

  var nameEl = document.getElementById('pp-name');
  var roleEl = document.getElementById('pp-role');
  var locEl  = document.getElementById('pp-loc');
  var avatarEl = document.getElementById('pp-avatar');
  if (!nameEl) return;

  var fullName = [first, last].filter(Boolean).join(' ');
  nameEl.innerHTML = fullName ? escDir(fullName) : '<span class="d-preview-empty">Your name</span>';

  var roleOrg = [role, org].filter(Boolean).join(' · ');
  roleEl.innerHTML = roleOrg ? escDir(roleOrg) : '<span class="d-preview-empty">Add your role or organisation…</span>';

  var location = [city, country].filter(Boolean).join(', ');
  if (location) { locEl.textContent = location; locEl.style.display = ''; }
  else { locEl.style.display = 'none'; }

  if (avatarEl && !avatarEl.querySelector('img')) {
    avatarEl.textContent = (first.charAt(0) || '?').toUpperCase();
  }
}

async function submitProfile() {
  var required = ['rf-first', 'rf-last', 'rf-country', 'rf-city'];
  var firstInvalid = null;
  required.forEach(function(id) {
    var el = document.getElementById(id);
    var err = document.getElementById(id + '-err');
    var ok = el.value.trim().length > 0;
    el.classList.toggle('invalid', !ok);
    if (err) err.classList.toggle('show', !ok);
    if (!ok && !firstInvalid) firstInvalid = el;
  });
  if (firstInvalid) { firstInvalid.focus(); return; }

  var btn = document.getElementById('rf-submit-btn');
  var status = document.getElementById('rf-status');
  btn.disabled = true;
  btn.textContent = 'Saving…';
  status.classList.remove('show', 'error');

  var payload = {
    firstName: document.getElementById('rf-first').value.trim(),
    lastName: document.getElementById('rf-last').value.trim(),
    city: document.getElementById('rf-city').value.trim(),
    country: document.getElementById('rf-country').value.trim(),
    organization: document.getElementById('rf-org').value.trim(),
    cohort: Array.from(document.querySelectorAll('#rf-cohort-grid input:checked')).map(function(el) { return el.value; }).join(', '),
    sector: document.getElementById('rf-sector').value,
    role: document.getElementById('rf-role').value.trim(),
    email: document.getElementById('rf-email').value.trim(),

    headshotData: pendingHeadshotData,
    shareWithCommunity: document.getElementById('rf-optin').checked,
  };

  try {
    var res = await fetch('/api/register-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('request failed');

    var savedHeadshotData = pendingHeadshotData || (currentProfileData && currentProfileData.headshotData) || '';
    currentProfileData = {
      hasProfile: true,
      firstName: payload.firstName,
      lastName: payload.lastName,
      city: payload.city,
      country: payload.country,
      organization: payload.organization,
      sector: payload.sector,
      cohorts: payload.cohort ? payload.cohort.split(', ') : [],
      role: payload.role,
      displayEmail: payload.email,

      shareWithCommunity: payload.shareWithCommunity,
      headshotData: savedHeadshotData,
    };
    setNavAvatar(payload.firstName, savedHeadshotData);
    var greetingEl = document.getElementById('home-greeting-name');
    if (greetingEl && payload.firstName) greetingEl.textContent = payload.firstName.trim();

    loadDirectory();

    btn.disabled = false;
    btn.textContent = 'Saved ✓';
    if (profileIsFirstRun) {
      profileIsFirstRun = false;
      var closeBtn = document.getElementById('profile-close-btn');
      if (closeBtn) closeBtn.style.display = '';
    }
    setTimeout(function() {
      document.getElementById('profile-modal').classList.remove('open');
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleProfileKeydown);
      btn.textContent = 'Save profile';
    }, 800);
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'Save profile';
    status.textContent = 'Something went wrong saving this — please try again in a moment.';
    status.classList.add('show', 'error');
  }
}

var proposeLastFocused = null;

function openPropose() {
  resetProposeForm();
  proposeLastFocused = document.activeElement;
  document.getElementById('propose-modal').classList.add('open');
  document.body.style.overflow='hidden';
  document.addEventListener('keydown', handleProposeKeydown);
  var titleInput = document.getElementById('pf-title');
  if (titleInput) titleInput.focus();
}
function closePropose() {
  document.getElementById('propose-modal').classList.remove('open');
  document.body.style.overflow='';
  document.removeEventListener('keydown', handleProposeKeydown);
  if (proposeLastFocused) proposeLastFocused.focus();
}
function handleProposeKeydown(e) {
  if (e.key === 'Escape') { closePropose(); return; }
  if (e.key !== 'Tab') return;
  var modal = document.getElementById('propose-modal');
  var focusable = modal.querySelectorAll('button, input, select, textarea, a[href]');
  if (!focusable.length) return;
  var first = focusable[0], last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}
function updateFormatFields(format) {
  var showLocation = format === 'In person' || format === 'Hybrid';
  var showLink = format === 'Online' || format === 'Hybrid';
  document.getElementById('pf-location-field').style.display = showLocation ? '' : 'none';
  document.getElementById('pf-link-field').style.display = showLink ? '' : 'none';
  if (!showLocation) {
    document.getElementById('pf-location').classList.remove('invalid');
    document.getElementById('pf-location-err').classList.remove('show');
  }
}

function toggleFormType(btn) {
  btn.closest('.form-type-toggle').querySelectorAll('.form-type-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
  btn.classList.add('active');
  btn.setAttribute('aria-pressed', 'true');
  updateFormatFields(btn.textContent);
}

function resetProposeForm() {
  ['pf-title','pf-date','pf-duration','pf-desc','pf-location','pf-link'].forEach(function(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.value = '';
    el.classList.remove('invalid');
    var err = document.getElementById(id + '-err');
    if (err) err.classList.remove('show');
  });
  document.querySelectorAll('.form-type-toggle .form-type-btn').forEach(function(b, i) { b.classList.toggle('active', i === 0); b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false'); });
  updateFormatFields('Online');
  var status = document.getElementById('pf-status');
  if (status) { status.classList.remove('show', 'error'); status.textContent = ''; }
  var btn = document.getElementById('pf-submit-btn');
  if (btn) { btn.disabled = false; btn.textContent = 'Send'; }
}

async function submitPropose() {
  var activeFormat = document.querySelector('.form-type-toggle .form-type-btn.active');
  var format = activeFormat ? activeFormat.textContent : 'Online';

  var required = ['pf-title', 'pf-date', 'pf-desc'];
  if (format === 'In person' || format === 'Hybrid') required.push('pf-location');

  var firstInvalid = null;
  required.forEach(function(id) {
    var el = document.getElementById(id);
    var err = document.getElementById(id + '-err');
    var ok = el.value.trim().length > 0;
    el.classList.toggle('invalid', !ok);
    if (err) err.classList.toggle('show', !ok);
    if (!ok && !firstInvalid) firstInvalid = el;
  });
  if (firstInvalid) { firstInvalid.focus(); return; }

  var btn = document.getElementById('pf-submit-btn');
  var status = document.getElementById('pf-status');
  btn.disabled = true;
  btn.textContent = 'Sending…';
  status.classList.remove('show', 'error');

  var payload = {
    title: document.getElementById('pf-title').value.trim(),
    format: format,
    date: document.getElementById('pf-date').value,
    duration: document.getElementById('pf-duration').value.trim(),
    location: (format === 'In person' || format === 'Hybrid') ? document.getElementById('pf-location').value.trim() : '',
    link: (format === 'Online' || format === 'Hybrid') ? document.getElementById('pf-link').value.trim() : '',
    description: document.getElementById('pf-desc').value.trim(),
  };

  try {
    var res = await fetch('/api/propose-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('request failed');

    var card = document.querySelector('.propose-modal-card');
    card.innerHTML = '<div style="padding:60px 48px;text-align:center"><div style="font-size:32px;margin-bottom:20px">🌿</div><div style="font-family:Georgia,serif;font-size:20px;color:var(--soil-dark);margin-bottom:12px">Thank you</div><p style="font-size:14px;color:var(--ink-light);line-height:1.7;max-width:320px;margin:0 auto 32px">Your event has been sent and will appear in the community directly.</p><button class="btn-outline" data-action="closePropose" data-args="[]" style="margin:0 auto;display:block">Close</button></div>';
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'Send';
    status.textContent = 'Something went wrong sending this — please try again in a moment.';
    status.classList.add('show', 'error');
  }
}

// ── Climate events ────────────────────────────────────────────
var climateEventsLoaded = false;
var myClimateRsvps = new Set();

async function loadClimateEvents() {
  if (climateEventsLoaded) return;
  var grid = document.getElementById('climate-grid');
  if (!grid) return;
  try {
    var res = await fetch('/api/events?source=sheet');
    if (!res.ok) throw new Error('load failed');
    var data = await res.json();
    climateEventsLoaded = true;
    renderClimateGrid(data.events || []);
  } catch (err) {
    grid.innerHTML = '<p class="climate-empty">Could not load events — please refresh.</p>';
  }
}

function renderClimateGrid(events) {
  var grid = document.getElementById('climate-grid');
  if (!grid) return;
  if (!events.length) {
    grid.innerHTML = '<p class="climate-empty">No upcoming climate events listed yet.</p>';
    return;
  }
  grid.innerHTML = events.map(function(ev) {
    var meta = [];
    if (ev.startDate) {
      var d = ev.endDate && ev.endDate !== ev.startDate
        ? formatDate(ev.startDate) + ' – ' + formatDate(ev.endDate)
        : formatDate(ev.startDate);
      meta.push(d);
    }
    if (ev.city) meta.push(ev.city);

    var avatars = (ev.attendees || []).slice(0, 5).map(function(a) {
      var title = escHtml(a.name || a.email);
      if (a.headshot) {
        return '<div class="climate-avatar" title="' + title + '"><img src="data:image/jpeg;base64,' + SafeUI.headshot(a.headshot) + '" alt="' + title + '"></div>';
      }
      var initials = a.name ? a.name.trim().split(' ').map(function(p){ return p[0]; }).slice(0,2).join('') : '?';
      return '<div class="climate-avatar" title="' + title + '">' + escHtml(initials.toUpperCase()) + '</div>';
    }).join('');
    var count = (ev.attendees || []).length;
    var countText = count === 0 ? 'No one yet — be the first'
      : count === 1 ? '1 person going'
      : count + ' people going';

    var going = myClimateRsvps.has(ev.name) || ev.currentUserAttending;
    var btnLabel = going ? 'No longer attending' : 'I\'m going';
    var btnClass = going ? 'btn-going going' : 'btn-going';
    var btnDisabled = '';

    var discussBtn = ev.discussionLink
      ? '<a class="btn-discuss" href="' + escHtml(SafeUI.httpUrl(ev.discussionLink)) + '" target="_blank" rel="noopener">Discussion ↗</a>'
      : '';

    return '<div class="climate-card" data-event="' + escHtml(ev.name) + '">' +
      '<div class="climate-card-name">' + escHtml(ev.name) + '</div>' +
      (meta.length ? '<div class="climate-card-meta">' + meta.map(escHtml).join('<span style="color:var(--border)">·</span>') + '</div>' : '') +
      (ev.description ? '<div class="climate-card-desc">' + escHtml(ev.description) + '</div>' : '') +
      '<div class="climate-card-footer">' +
        '<div class="climate-attendees">' + avatars + '<span class="climate-att-count">' + escHtml(countText) + '</span></div>' +
        '<div class="climate-card-actions">' + discussBtn +
          '<button class="' + btnClass + '" ' + actionAttrs('rsvpClimateEvent', [ev.name]) + '>' + btnLabel + '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

async function rsvpClimateEvent(btn, eventName) {
  if (btn.disabled) return;
  var isCancelling = btn.classList.contains('going');
  btn.disabled = true;
  btn.textContent = isCancelling ? 'Removing…' : 'Saving…';
  try {
    var res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: isCancelling ? 'cancel-rsvp' : 'rsvp', eventName: eventName }),
    });
    if (!res.ok) throw new Error('rsvp failed');
    if (isCancelling) {
      myClimateRsvps.delete(eventName);
    } else {
      myClimateRsvps.add(eventName);
    }
    climateEventsLoaded = false;
    loadClimateEvents();
  } catch (err) {
    btn.disabled = false;
    btn.textContent = isCancelling ? 'No longer attending' : 'I\'m going';
  }
}

function openProposeClimate() {
  document.getElementById('climate-propose-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeClimatePropose() {
  document.getElementById('climate-propose-modal').classList.remove('open');
  document.body.style.overflow = '';
}

async function submitClimatePropose() {
  var nameEl  = document.getElementById('cp-name');
  var startEl = document.getElementById('cp-start');
  var cityEl  = document.getElementById('cp-city');
  var valid = true;

  [['cp-name', nameEl], ['cp-start', startEl], ['cp-city', cityEl]].forEach(function(pair) {
    var ok = pair[1].value.trim().length > 0;
    pair[1].classList.toggle('invalid', !ok);
    var err = document.getElementById(pair[0] + '-err');
    if (err) err.classList.toggle('show', !ok);
    if (!ok) valid = false;
  });
  if (!valid) return;

  var btn    = document.getElementById('cp-submit-btn');
  var status = document.getElementById('cp-status');
  btn.disabled = true;
  btn.textContent = 'Sending…';
  status.classList.remove('show', 'error');

  try {
    var res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'propose',
        name:           nameEl.value.trim(),
        startDate:      startEl.value,
        endDate:        document.getElementById('cp-end').value,
        city:           cityEl.value.trim(),
        description:    document.getElementById('cp-desc').value.trim(),
        discussionLink: document.getElementById('cp-link').value.trim(),
      }),
    });
    if (!res.ok) throw new Error('failed');
    document.querySelector('#climate-propose-modal .propose-modal-card').innerHTML =
      '<div style="padding:48px;text-align:center">' +
      '<div style="font-family:Georgia,serif;font-size:20px;color:var(--soil-dark);margin-bottom:12px">Thank you</div>' +
      '<p style="font-size:14px;color:var(--ink-light);line-height:1.7;max-width:300px;margin:0 auto 28px">Your suggestion has been added and will appear in the events section directly.</p>' +
      '<button class="btn-outline" data-action="closeClimatePropose" data-args="[]" style="margin:0 auto;display:block">Close</button></div>';
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'Send suggestion';
    status.textContent = 'Something went wrong — please try again.';
    status.classList.add('show', 'error');
  }
}

function formatDate(str) {
  if (!str) return '';
  var d = new Date(str + 'T00:00:00');
  if (isNaN(d)) return str;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escHtml(s) {
  return String(s || '').replace(/[&<>"']/g, function(c) {
    return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
  });
}
// ── End climate events ─────────────────────────────────────────


// ── Forum ────────────────────────────────────────────────────────────────────
function timeAgo(ts) {
  var d = Date.now() - new Date(ts).getTime();
  var s = Math.floor(d/1000);
  if (s < 60) return 'just now';
  var m = Math.floor(s/60); if (m < 60) return m+'m ago';
  var h = Math.floor(m/60); if (h < 24) return h+'h ago';
  var dy = Math.floor(h/24);
  if (dy === 1) return 'yesterday';
  if (dy < 30) return dy+'d ago';
  return new Date(ts).toLocaleDateString('en-GB',{day:'numeric',month:'short'});
}
function escF(s) {
  return String(s||'').replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});
}

var forumView        = 'list';
var forumCurrent     = null;
var forumCurrentPost = null;
var forumMembership  = {};
var forumForums      = [];
var forumPostsMap    = {};

function forumShowView(view) {
  forumView = view;
  document.getElementById('forum-view-list').style.display   = view === 'list'   ? '' : 'none';
  document.getElementById('forum-view-posts').style.display  = view === 'posts'  ? '' : 'none';
  document.getElementById('forum-view-thread').style.display = view === 'thread' ? '' : 'none';
  window.scrollTo(0, 0);
  if (view === 'list')  loadForumList();
  if (view === 'posts') loadForumPosts(forumCurrent);
}

function loadForum() {
  forumView = 'list';
  document.getElementById('forum-view-list').style.display   = '';
  document.getElementById('forum-view-posts').style.display  = 'none';
  document.getElementById('forum-view-thread').style.display = 'none';
  loadForumList();
}

function loadForumList() {
  var el = document.getElementById('forum-list');
  if (!el) return;
  el.innerHTML = '<p style="font-size:13px;color:var(--ink-light);padding:16px 0">Loading…</p>';
  fetch('/api/bulletin?action=forums')
    .then(function(r) { return r.json(); })
    .then(function(d) {
      forumForums = d.forums || [];
      el.innerHTML = forumForums.map(function(f) {
        var joined = !!forumMembership[f.name];
        return '<div class="forum-card">' +
          '<div class="forum-card-body" style="cursor:pointer" ' + actionAttrs('enterForum', [f.name]) + '>' +
          '<div class="forum-card-name">' + escF(f.name) + '</div>' +
          '<div class="forum-card-desc">' + escF(f.description) + '</div>' +
          '<div class="forum-card-meta">' + f.memberCount + ' member' + (f.memberCount !== 1 ? 's' : '') + '</div>' +
          '</div>' +
          '<div class="forum-card-actions">' +
          '<button class="btn-forum-join' + (joined ? ' member' : '') + '" ' + actionAttrs('toggleForumMember', [f.name]) + '>' + (joined ? 'Joined ✓' : 'Join') + '</button>' +
          (!joined ? '<span class="forum-join-note">You\'ll be notified of new posts by email.</span>' : '') +
          '</div>' +
          '</div>';
      }).join('') || '<p style="font-size:13px;color:var(--ink-light)">No forums available yet.</p>';
    })
    .catch(function() {
      el.innerHTML = '<p style="font-size:13px;color:var(--ink-light)">Could not load forums.</p>';
    });
}

function toggleForumMember(forum, btn) {
  var joined = !!forumMembership[forum];
  var action = joined ? 'leave' : 'join';
  if (joined && !confirm('Leave this forum? You will stop receiving notifications and will need to rejoin to post.')) return;
  fetch('/api/bulletin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: action, forum: forum }),
  }).then(function(r) { return r.json(); }).then(function(d) {
    if (d.ok) {
      forumMembership[forum] = !joined;
      loadForumList();
    }
  }).catch(function() {});
}


function enterForum(forum) {
  forumCurrent = forum;
  forumShowView('posts');
}

function loadForumPosts(forum) {
  var feed    = document.getElementById('forum-posts-feed');
  var titleEl = document.getElementById('forum-posts-title');
  var descEl  = document.getElementById('forum-posts-desc');
  if (!feed) return;
  var f = forumForums.find(function(x) { return x.name === forum; });
  if (titleEl) titleEl.textContent = forum;
  if (descEl)  descEl.textContent  = f ? f.description : '';
  feed.innerHTML = '<p style="font-size:13px;color:var(--ink-light);padding:16px 0">Loading…</p>';
  fetch('/api/bulletin?action=posts&forum=' + encodeURIComponent(forum))
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (d.isMember !== undefined) {
        forumMembership[forum] = d.isMember;
        var _newBtn  = document.getElementById('forum-new-post-btn');
        var _joinStr = document.getElementById('forum-join-strip');
        if (_newBtn)  _newBtn.style.display  = d.isMember ? '' : 'none';
        if (_joinStr) _joinStr.style.display  = d.isMember ? 'none' : 'flex';
      }
      var posts = d.posts || [];
      forumPostsMap = {};
      posts.forEach(function(p) { forumPostsMap[p.postId] = p; });
      if (!posts.length) {
        feed.innerHTML = '<p style="font-size:13px;color:var(--ink-light);padding:24px 0">No posts yet — be the first to start a conversation.</p>';
        return;
      }
      feed.innerHTML = posts.map(function(p) {
        var init    = (p.authorName || '?')[0].toUpperCase();
        var excerpt = p.body.length > 120 ? p.body.slice(0,120) + '…' : p.body;
        var rCount  = p.replies.length;
        var rTxt    = rCount ? rCount + ' repl' + (rCount !== 1 ? 'ies' : 'y') : 'No replies yet';
        return '<div class="fpost" ' + actionAttrs('openForumThread', [p.postId]) + '>' +
          '<div class="fpost-meta"><div class="fpost-av">' + escF(init) + '</div>' +
          '<span class="fpost-author">' + escF(p.authorName) + '</span>' +
          '<span class="fpost-date">' + timeAgo(p.timestamp) + '</span></div>' +
          '<div class="fpost-title">' + escF(p.title) + '</div>' +
          '<div class="fpost-excerpt">' + escF(excerpt) + '</div>' +
          '<div class="fpost-reply-count">' + rTxt + '</div>' +
          '</div>';
      }).join('');
    })
    .catch(function() {
      feed.innerHTML = '<p style="font-size:13px;color:var(--ink-light);padding:16px 0">Could not load posts.</p>';
    });
}

function openForumThread(postId) {
  var bcName = document.getElementById('forum-bc-name');
  if (bcName) bcName.textContent = forumCurrent;
  var post = forumPostsMap[postId];
  if (!post) return;
  forumCurrentPost = post;
  renderForumThread(post);
  document.getElementById('forum-reply-body').value = '';
  document.getElementById('forum-reply-status').textContent = '';
  var isMember = !!forumMembership[forumCurrent];
  document.getElementById('forum-reply-join-note').style.display = isMember ? 'none' : '';
  document.getElementById('forum-reply-form').style.display = isMember ? '' : 'none';
  forumShowView('thread');
}

function renderForumThread(post) {
  var el = document.getElementById('forum-thread-content');
  if (!el) return;
  var init = (post.authorName || '?')[0].toUpperCase();
  var repliesHtml = (post.replies || []).map(function(r) {
    var ri = (r.authorName || '?')[0].toUpperCase();
    return '<div class="freply">' +
      '<div class="fpost-meta"><div class="fpost-av">' + escF(ri) + '</div>' +
      '<span class="fpost-author">' + escF(r.authorName) + '</span>' +
      '<span class="fpost-date">' + timeAgo(r.timestamp) + '</span></div>' +
      '<div class="freply-body">' + escF(r.body) + '</div>' +
      '</div>';
  }).join('');
  var repliesSection = post.replies && post.replies.length
    ? '<div class="fthread-replies-hdr">' + post.replies.length + ' ' + (post.replies.length === 1 ? 'reply' : 'replies') + '</div>' + repliesHtml
    : '<p style="font-size:13px;color:var(--ink-light);padding:12px 0 8px">No replies yet.</p>';
  el.innerHTML =
    '<div class="fthread-post">' +
      '<div class="fpost-meta" style="margin-bottom:12px"><div class="fpost-av">' + escF(init) + '</div>' +
      '<span class="fpost-author">' + escF(post.authorName) + '</span>' +
      '<span class="fpost-date">' + timeAgo(post.timestamp) + '</span></div>' +
      '<div class="fthread-title">' + escF(post.title) + '</div>' +
      '<div class="fthread-body">' + escF(post.body) + '</div>' +
    '</div>' +
    repliesSection;
}

function submitForumReply() {
  var body   = document.getElementById('forum-reply-body').value.trim();
  var status = document.getElementById('forum-reply-status');
  if (!body) { status.textContent = 'Please write a reply.'; return; }
  status.textContent = 'Posting…';
  fetch('/api/bulletin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'reply', forum: forumCurrent, postId: forumCurrentPost.postId, body: body }),
  }).then(function(r) { return r.json(); }).then(function(d) {
    if (d.ok) {
      document.getElementById('forum-reply-body').value = '';
      status.textContent = '';
      fetch('/api/bulletin?action=posts&forum=' + encodeURIComponent(forumCurrent))
        .then(function(r) { return r.json(); })
        .then(function(d2) {
          var updated = (d2.posts || []).find(function(p) { return p.postId === forumCurrentPost.postId; });
          if (updated) { forumCurrentPost = updated; forumPostsMap[updated.postId] = updated; renderForumThread(updated); }
        });
    } else {
      status.textContent = d.error || 'Something went wrong.';
    }
  }).catch(function() { status.textContent = 'Could not post reply.'; });
}

function joinFromPostsView() {
  var joinBtn = document.querySelector('#forum-join-strip .btn-forum-join');
  if (joinBtn) { joinBtn.disabled = true; joinBtn.textContent = 'Joining…'; }
  fetch('/api/bulletin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'join', forum: forumCurrent }),
  }).then(function(r) { return r.json(); }).then(function(d) {
    if (d.ok) {
      forumMembership[forumCurrent] = true;
      loadForumPosts(forumCurrent);
    } else {
      if (joinBtn) { joinBtn.disabled = false; joinBtn.textContent = 'Join'; }
    }
  }).catch(function() {
    if (joinBtn) { joinBtn.disabled = false; joinBtn.textContent = 'Join'; }
  });
}

function openForumPostModal() {
  document.getElementById('forum-post-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeForumPostModal() {
  document.getElementById('forum-post-modal').classList.remove('open');
  document.body.style.overflow = '';
}
function submitForumPost() {
  var title  = document.getElementById('fpost-title').value.trim();
  var body   = document.getElementById('fpost-body').value.trim();
  var status = document.getElementById('fpost-status');
  if (!title) { status.textContent = 'Please add a title.';       status.style.color = 'var(--soil-mid)'; return; }
  if (!body)  { status.textContent = 'Please write a message.';   status.style.color = 'var(--soil-mid)'; return; }
  status.textContent = 'Posting…'; status.style.color = 'var(--ink-light)';
  fetch('/api/bulletin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'post', forum: forumCurrent, title: title, body: body }),
  }).then(function(r) { return r.json(); }).then(function(d) {
    if (d.ok) {
      status.textContent = '✓ Posted.'; status.style.color = 'var(--soil)';
      document.getElementById('fpost-title').value = '';
      document.getElementById('fpost-body').value = '';
      setTimeout(function() { closeForumPostModal(); loadForumPosts(forumCurrent); }, 1200);
    } else {
      status.textContent = d.error || 'Something went wrong.'; status.style.color = 'var(--soil-mid)';
    }
  }).catch(function() { status.textContent = 'Could not post.'; status.style.color = 'var(--soil-mid)'; });
}

function openForumProposeModal() {
  document.getElementById('forum-propose-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeForumProposeModal() {
  document.getElementById('forum-propose-modal').classList.remove('open');
  document.body.style.overflow = '';
}
function submitForumPropose() {
  var name    = document.getElementById('fpropose-name').value.trim();
  var purpose = document.getElementById('fpropose-purpose').value.trim();
  var desc    = document.getElementById('fpropose-desc').value.trim();
  var status  = document.getElementById('fpropose-status');
  if (!name)    { status.textContent = 'Please add a forum name.';      status.style.color = 'var(--soil-mid)'; return; }
  if (!purpose) { status.textContent = 'Please describe the purpose.';  status.style.color = 'var(--soil-mid)'; return; }
  var _propBtn = document.querySelector('#forum-propose-modal .btn-submit');
  if (_propBtn) _propBtn.disabled = true;
  status.textContent = 'Sending…'; status.style.color = 'var(--ink-light)';
  fetch('/api/bulletin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'propose', name: name, purpose: purpose, description: desc }),
  }).then(function(r) { return r.json(); }).then(function(d) {
    if (d.ok) {
      status.textContent = 'Proposal sent — thank you. We\'ll review it and add it.'; status.style.color = 'var(--soil)';
      document.getElementById('fpropose-name').value = '';
      document.getElementById('fpropose-purpose').value = '';
      document.getElementById('fpropose-desc').value = '';
      setTimeout(closeForumProposeModal, 2000);
    } else {
      if (_propBtn) _propBtn.disabled = false;
      status.textContent = d.error || 'Something went wrong.'; status.style.color = 'var(--soil-mid)';
    }
  }).catch(function() { if (_propBtn) _propBtn.disabled = false; status.textContent = 'Could not send. Try again.'; status.style.color = 'var(--soil-mid)'; });
}

// Photo gallery / lightbox
var galReturnFocus = null;
var galIdx = 0;
var galSrcs = [];
function openGallery(startIdx, galleryId) {
  galReturnFocus = document.activeElement;
  galleryId = galleryId || 'na-gallery-data';
  galSrcs = Array.from(document.querySelectorAll('#' + galleryId + ' img')).map(function(i) { return i.dataset.src || i.src; });
  galIdx = startIdx;
  var thumbs = document.getElementById('gal-thumbs');
  thumbs.innerHTML = galSrcs.map(function(src, i) {
    return '<button type="button" class="gal-thumb" aria-label="View photo ' + (i + 1) + '" ' + actionAttrs('galJump', [i]) + '><img src="' + escHtml(src) + '" loading="lazy" alt=""></button>';
  }).join('');
  galRender();
  document.getElementById('gal-modal').classList.add('open');
  document.querySelector('#gal-modal .gal-close').focus();
  document.body.style.overflow = 'hidden';
}
function closeGallery() {
  document.getElementById('gal-modal').classList.remove('open');
  if (galReturnFocus) galReturnFocus.focus();
  document.body.style.overflow = '';
}
function galleryNav(dir) {
  galIdx = (galIdx + dir + galSrcs.length) % galSrcs.length;
  galRender();
}
function galJump(idx) {
  galIdx = idx;
  galRender();
}
function galRender() {
  document.getElementById('gal-img').src = galSrcs[galIdx];
  document.getElementById('gal-counter').textContent = (galIdx + 1) + ' / ' + galSrcs.length;
  var thumbEls = document.querySelectorAll('#gal-thumbs .gal-thumb');
  thumbEls.forEach(function(t, i) { t.classList.toggle('active', i === galIdx); });
  if (thumbEls[galIdx]) thumbEls[galIdx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}
document.addEventListener('keydown', function(e) {
  var modal = document.getElementById('gal-modal');
  if (!modal || !modal.classList.contains('open')) return;
  if (e.key === 'Tab') {
    var controls = Array.from(modal.querySelectorAll('button'));
    var first = controls[0], last = controls[controls.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.preventDefault();
  if (e.key === 'ArrowLeft')  galleryNav(-1);
  if (e.key === 'ArrowRight') galleryNav(1);
  if (e.key === 'Escape')     closeGallery();
});
document.addEventListener('keydown', function(e) {
  if (e.key !== 'Escape') return;
  if (document.getElementById('forum-post-modal')?.classList.contains('open'))     closeForumPostModal();
  if (document.getElementById('forum-propose-modal')?.classList.contains('open'))  closeForumProposeModal();
  if (document.getElementById('climate-propose-modal')?.classList.contains('open')) closeClimatePropose();
  if (document.getElementById('offer-modal')?.classList.contains('open'))           closeOfferModal();
});

function setNavAvatar(firstName, headshotData) {
  var btn = document.querySelector('.nav-profile');
  if (!btn) return;
  if (headshotData) {
    btn.textContent = '';
    var img = document.createElement('img');
    img.src = 'data:image/jpeg;base64,' + headshotData;
    img.alt = firstName || '';
    btn.appendChild(img);
  } else if (firstName) {
    btn.textContent = firstName.trim().charAt(0).toUpperCase();
  }
}

(async function initSession() {
  try {
    var res = await fetch('/api/get-profile');
    if (!res.ok) { window.location.href = '/login.html'; return; }
    var data = await res.json();
    currentProfileData = data;
    setNavAvatar(data.firstName, data.headshotData);
    var greetingEl = document.getElementById('home-greeting-name');
    if (greetingEl && data.firstName) greetingEl.textContent = data.firstName.trim();
    if (!data.hasProfile) { profileIsFirstRun = true; openProfile(); }
  } catch (err) {
    // Network hiccup — leave the page usable rather than forcing a redirect loop.
  }
})();

var dirMembers = [];
var dirLoaded = false;
var dirLoadError = false;

function escDir(s) {
  return String(s || '').replace(/[&<>"]/g, function(c) { return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]; });
}

function dirInitial(m) {
  return (m.firstName || '?').trim().charAt(0).toUpperCase();
}

function renderDirectory() {
  var grid = document.getElementById('dir-grid');
  var q = document.getElementById('dir-search').value.trim().toLowerCase();
  var region = document.getElementById('dir-filter-region').value;
  var sector = document.getElementById('dir-filter-sector').value;
  var cohort = document.getElementById('dir-filter-cohort').value;
  var filtered = dirMembers.filter(function(m) {
    if (region && m.region !== region) return false;
    if (sector && m.sector !== sector) return false;
    if (cohort && m.cohorts.indexOf(cohort) === -1) return false;
    if (q) {
      var haystack = [m.firstName, m.lastName, m.organization, m.country, m.city].join(' ').toLowerCase();
      if (haystack.indexOf(q) === -1) return false;
    }
    return true;
  });

  if (!dirLoaded) {
    grid.innerHTML = '<p style="grid-column:1/-1;color:var(--ink-light);font-size:14px">Loading members…</p>';
    return;
  }
  if (dirLoadError) {
    grid.innerHTML = '<p style="grid-column:1/-1;color:var(--ink-light);font-size:14px">Could not load the directory — please refresh the page.</p>';
    return;
  }

  if (!filtered.length) {
    grid.innerHTML = '<p style="grid-column:1/-1;color:var(--ink-light);font-size:14px">No members match these filters yet.</p>';
    return;
  }

  var PIN = '<svg width="8" height="11" viewBox="0 0 8 11" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M4 0C1.79 0 0 1.79 0 4c0 3 4 7 4 7s4-4 4-7c0-2.21-1.79-4-4-4zm0 5.5c-.83 0-1.5-.67-1.5-1.5S3.17 2.5 4 2.5 5.5 3.17 5.5 4 4.83 5.5 4 5.5z"/></svg>';
  grid.innerHTML = filtered.map(function(m) {
    var location = [m.city, m.country].filter(Boolean).join(', ');
    var roleOrg = [m.role, m.organization].filter(Boolean).join(' · ');
    var roleOrgLine = roleOrg ? '<div class="d-role">' + escDir(roleOrg) + '</div>' : '';
    var locationLine = location ? '<div class="d-location">' + PIN + escDir(location) + '</div>' : '';
    var sectorTag = m.sector ? '<div class="d-tags-section"><span class="d-meta-label">Sector</span><div class="d-tags"><span class="d-tag d-tag--sector">' + escDir(m.sector) + '</span></div></div>' : '';
    var retreatTags = m.cohorts && m.cohorts.length ? '<div class="d-tags-section"><span class="d-meta-label">Retreats attended</span><div class="d-tags">' + m.cohorts.map(function(t){ return '<span class="d-tag">' + escDir(t) + '</span>'; }).join('') + '</div></div>' : '';
    var contact = m.email
      ? '<div class="d-contact-row"><span class="d-contact-label">Email</span><a href="mailto:' + escDir(m.email) + '">' + escDir(m.email) + '</a></div>'
      : '<div class="d-contact-empty">This member hasn\'t shared contact details yet.</div>';
    var contactDiv = (sectorTag || retreatTags)
      ? '<div class="d-contact d-contact--sep">' + contact + '</div>'
      : '<div class="d-contact">' + contact + '</div>';
    var avatarContent = m.headshotData
      ? '<img src="data:image/jpeg;base64,' + SafeUI.headshot(m.headshotData) + '" alt="">'
      : escDir(dirInitial(m));
    return '<details class="d-card"><summary><div class="d-avatar">' + avatarContent + '</div><h4>' +
      escDir(m.firstName + ' ' + m.lastName) + '</h4>' + roleOrgLine + locationLine +
      '<div class="d-expand-hint"><span class="chevron">&#9656;</span><span>More info</span></div></summary>' +
      '<div class="d-expanded">' + sectorTag + retreatTags + contactDiv + '</div></details>';
  }).join('');
}

async function loadDirectory() {
  try {
    var res = await fetch('/api/list-directory');
    if (!res.ok) throw new Error('request failed');
    var data = await res.json();
    dirMembers = data.members || [];
    dirLoadError = false;
  } catch (err) {
    dirMembers = [];
    dirLoadError = true;
  }
  dirLoaded = true;
  renderDirectory();
}

// City suggestions through the authenticated same-origin Photon proxy
(function() {
  var cityDebounce = null;
  var lastResults = [];
  var cityInput = document.getElementById('rf-city');
  if (!cityInput) return;

  cityInput.addEventListener('input', function() {
    clearTimeout(cityDebounce);
    var q = this.value.trim();
    var dl = document.getElementById('rf-city-suggestions');
    if (!dl) return;
    if (q.length < 2) { dl.innerHTML = ''; lastResults = []; return; }
    cityDebounce = setTimeout(function() {
      fetch('/api/cities?q=' + encodeURIComponent(q))
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (cityInput.value.trim() !== q) return;
        lastResults = data.features || [];
        var selectedCountry = ((document.getElementById('rf-country') || {}).value || '').trim().toLowerCase();
        var toShow = selectedCountry
          ? lastResults.filter(function(f) { return ((f.properties && f.properties.country) || '').toLowerCase() === selectedCountry; })
          : lastResults;
        if (selectedCountry && toShow.length === 0) toShow = lastResults;
        var seen = new Set();
        dl.innerHTML = toShow.map(function(f) {
          var name = f.properties && f.properties.name;
          if (!name) return '';
          var key = name.toLowerCase();
          if (seen.has(key)) return '';
          seen.add(key);
          var country = (f.properties && f.properties.country) || '';
          return '<option value="' + SafeUI.escape(name) + '">' + SafeUI.escape(country) + '</option>';
        }).join('');
      })
      .catch(function() {});
    }, 300);
  });

  // On blur, normalize capitalisation when user picked from the dropdown.
  cityInput.addEventListener('blur', function() {
    var q = this.value.trim();
    if (q.length < 2) return;
    for (var i = 0; i < lastResults.length; i++) {
      var name = lastResults[i].properties && lastResults[i].properties.name;
      if (name && name.toLowerCase() === q.toLowerCase() && name !== q) {
        cityInput.value = name;
        if (typeof updateProfilePreview === 'function') updateProfilePreview();
        return;
      }
    }
  });
})();

document.getElementById('dir-search').addEventListener('input', renderDirectory);
document.getElementById('dir-filter-region').addEventListener('change', renderDirectory);
document.getElementById('dir-filter-sector').addEventListener('change', renderDirectory);
document.getElementById('dir-filter-cohort').addEventListener('change', renderDirectory);
loadDirectory();

var ocCatFilter = 'all';
var ocFeeFilter = 'all';
function ocFilter(btn, value, type) {
  document.querySelectorAll('.so-chip[data-type="' + type + '"]').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
  if (type === 'cat') ocCatFilter = value; else ocFeeFilter = value;
  var cards = document.querySelectorAll('.oc-card');
  var visible = 0;
  cards.forEach(function(card){
    var ok = (ocCatFilter === 'all' || card.dataset.cat === ocCatFilter) &&
             (ocFeeFilter === 'all' || card.dataset.fee === ocFeeFilter);
    card.style.display = ok ? 'flex' : 'none';
    if (ok) visible++;
  });
  document.getElementById('oc-empty').style.display = visible === 0 ? 'block' : 'none';
}
async function loadOfferings() {
  var grid = document.getElementById('oc-grid');
  var empty = document.getElementById('oc-empty');
  empty.style.display = 'block';
  empty.textContent = 'Loading offerings…';
  try {
    var response = await fetch('/api/list-offerings');
    if (!response.ok) throw new Error('Unable to load');
    var data = await response.json();
    grid.replaceChildren();
    (data.offerings || []).forEach(function(offer) {
      var card = document.createElement('article');
      card.className = 'oc-card';
      card.dataset.cat = offer.category || '';
      card.dataset.fee = offer.fee_type || '';
      [['oc-name', offer.name], ['oc-cat-tag', offer.category], ['oc-title', offer.title],
       ['oc-service-location', [offer.location, offer.format].filter(Boolean).join(' · ')],
       ['oc-desc', offer.description], ['oc-fee', offer.fee_info]].forEach(function(field) {
        if (!field[1]) return;
        var el = document.createElement(field[0] === 'oc-title' ? 'h3' : 'p');
        el.className = field[0]; el.textContent = field[1]; card.appendChild(el);
      });
      var links = document.createElement('div'); links.className = 'oc-ext-links';
      [['Website', offer.website], ['LinkedIn', offer.linkedin]].forEach(function(item) {
        var url = SafeUI.httpUrl(item[1]);
        if (!url) return;
        var link = document.createElement('a'); link.textContent = item[0]; link.href = url;
        link.target = '_blank'; link.rel = 'noopener noreferrer'; links.appendChild(link);
      });
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(offer.email || '')) {
        var contact = document.createElement('a'); contact.textContent = 'Contact';
        contact.href = 'mailto:' + encodeURIComponent(offer.email); links.appendChild(contact);
      }
      card.appendChild(links); grid.appendChild(card);
    });
    empty.textContent = 'No offerings yet. Share the first one.';
    empty.style.display = grid.children.length ? 'none' : 'block';
    return true;
  } catch {
    empty.textContent = 'Offerings could not be loaded. Select this tab again to retry.';
    return false;
  }
}
function dirTab(tab) {
  if (tab === 'offerings') loadOfferings();
  document.querySelectorAll('#page-directory .dir-tab').forEach(function(t){ t.classList.remove('active'); });
  document.querySelectorAll('#page-directory .dir-panel').forEach(function(p){ p.classList.remove('active'); });
  document.getElementById('dtab-' + tab).classList.add('active');
  document.getElementById('dpanel-' + tab).classList.add('active');
}

function openOfferModal() {
  document.getElementById('offer-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeOfferModal() {
  document.getElementById('offer-modal').classList.remove('open');
  document.body.style.overflow = '';
}

var offerFmtSelected = 'remote';
function selectOfferFormat(type) {
  offerFmtSelected = type;
  ['remote','inperson','both'].forEach(function(t){
    document.getElementById('of-fmt-' + t).classList.toggle('selected', type === t);
  });
}
function submitOffer() {
  var name  = document.getElementById('of-name').value.trim();
  var email = document.getElementById('of-email').value.trim();
  var title = document.getElementById('of-title').value.trim();
  var desc  = document.getElementById('of-desc').value.trim();
  var st    = document.getElementById('of-status');
  if (!name || !email || !title || !desc) {
    st.className = 'form-status error show';
    st.textContent = 'Please fill in name, email, title and description.';
    return;
  }
  var formatLabel = offerFmtSelected === 'remote' ? 'Remote' : offerFmtSelected === 'inperson' ? 'In person' : 'Both';
  var payload = {
    name: name, email: email,
    category: document.getElementById('of-cat').value,
    location: document.getElementById('of-location').value.trim(),
    format: formatLabel,
    title: title, description: desc,
    website: document.getElementById('of-web').value,
    linkedin: document.getElementById('of-li').value,
  };
  var _offerBtn = document.querySelector('#offer-modal .btn-submit');
  if (_offerBtn) _offerBtn.disabled = true;
  st.className = 'form-status show'; st.textContent = 'Submitting…';
  fetch('/api/submit-offer', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
    .then(function(r){ return r.ok ? r.json() : Promise.reject(); })
    .then(async function(){ var loaded = await loadOfferings(); st.textContent = loaded ? 'Thank you! Your offer is now visible in the directory.' : 'Your offer was saved. Reopen the offerings tab to load it.'; })
    .catch(function(){ if (_offerBtn) _offerBtn.disabled = false; st.className = 'form-status error show'; st.textContent = 'Something went wrong — please try again.'; });
}


// Refresh session cookie on every visit so logged-in users stay logged in
fetch('/api/refresh-session', { method: 'POST' }).catch(function() {});

SafeUI.bindActions({
  rsvpClimateEvent: function(name) { rsvpClimateEvent(this, name); },
  toggleForumMember: function(name) { toggleForumMember(name, this); },
  enterForum, openForumThread, galJump, closePropose, closeClimatePropose
});

// Bind trusted, static page controls without inline script permissions.
document.querySelector('[data-bind-click="0"]').addEventListener('click', function(event) {
  var result = (function(event) { show('home') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="1"]').addEventListener('click', function(event) {
  var result = (function(event) { show('retreats') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="2"]').addEventListener('click', function(event) {
  var result = (function(event) { show('resources') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="3"]').addEventListener('click', function(event) {
  var result = (function(event) { show('events') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="4"]').addEventListener('click', function(event) {
  var result = (function(event) { show('directory') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="5"]').addEventListener('click', function(event) {
  var result = (function(event) { show('bulletin') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="6"]').addEventListener('click', function(event) {
  var result = (function(event) { openProfile() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="7"]').addEventListener('click', function(event) {
  var result = (function(event) { if(!profileIsFirstRun&&event.target===this)closeProfile() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="8"]').addEventListener('click', function(event) {
  var result = (function(event) { closeProfile() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-input="9"]').addEventListener('input', function(event) {
  var result = (function(event) { updateProfilePreview() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-input="10"]').addEventListener('input', function(event) {
  var result = (function(event) { updateProfilePreview() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-input="11"]').addEventListener('input', function(event) {
  var result = (function(event) { updateProfilePreview() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-input="12"]').addEventListener('input', function(event) {
  var result = (function(event) { updateProfilePreview() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-input="13"]').addEventListener('input', function(event) {
  var result = (function(event) { updateProfilePreview() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-change="14"]').addEventListener('change', function(event) {
  var result = (function(event) { updateProfilePreview() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-input="15"]').addEventListener('input', function(event) {
  var result = (function(event) { updateProfilePreview() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-change="16"]').addEventListener('change', function(event) {
  var result = (function(event) { previewHeadshot(this) }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="17"]').addEventListener('click', function(event) {
  var result = (function(event) { submitProfile() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="18"]').addEventListener('click', function(event) {
  var result = (function(event) { openStoryModal() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="19"]').addEventListener('click', function(event) {
  var result = (function(event) { openStoryModal() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="20"]').addEventListener('click', function(event) {
  var result = (function(event) { if(event.target===this)closeStoryModal() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="21"]').addEventListener('click', function(event) {
  var result = (function(event) { closeStoryModal() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="22"]').addEventListener('click', function(event) {
  var result = (function(event) { filterEvs(this,'all') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="23"]').addEventListener('click', function(event) {
  var result = (function(event) { filterEvs(this,'online') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="24"]').addEventListener('click', function(event) {
  var result = (function(event) { show('events') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-mouseover="25"]').addEventListener('mouseover', function(event) {
  var result = (function(event) { this.style.background='#0F2419' }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-mouseout="26"]').addEventListener('mouseout', function(event) {
  var result = (function(event) { this.style.background='var(--soil)' }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="27"]').addEventListener('click', function(event) {
  var result = (function(event) { selectRetreat(this,'pv2022','tl') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="28"]').addEventListener('click', function(event) {
  var result = (function(event) { selectRetreat(this,'na2023','tl') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="29"]').addEventListener('click', function(event) {
  var result = (function(event) { selectRetreat(this,'eu2023','tl') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="30"]').addEventListener('click', function(event) {
  var result = (function(event) { selectRetreat(this,'bali2024','tl') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="31"]').addEventListener('click', function(event) {
  var result = (function(event) { selectRetreat(this,'cr2024','tl') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="32"]').addEventListener('click', function(event) {
  var result = (function(event) { selectRetreat(this,'gg2024','tl') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="33"]').addEventListener('click', function(event) {
  var result = (function(event) { selectRetreat(this,'tz2025','tl') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="34"]').addEventListener('click', function(event) {
  var result = (function(event) { selectRetreat(this,'fiji2025','tl') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="35"]').addEventListener('click', function(event) {
  var result = (function(event) { selectRetreat(this,'pv2025','tl') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="36"]').addEventListener('click', function(event) {
  var result = (function(event) { selectRetreat(this,'mx2026','tl') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="37"]').addEventListener('click', function(event) {
  var result = (function(event) { selectRetreat(this,'au2026','tl') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="38"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(2, 'oceania-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="39"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(12, 'oceania-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="40"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(21, 'oceania-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="41"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(0, 'oceania-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="42"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(4, 'asiapac-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="43"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(21, 'asiapac-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="44"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(35, 'asiapac-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="45"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(0, 'asiapac-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="46"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(1, 'na-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="47"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(5, 'na-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="48"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(9, 'na-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="49"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(0, 'na-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="50"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(0, 'eu-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="51"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(1, 'eu-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="52"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(2, 'eu-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="53"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(0, 'eu-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="54"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(0, 'bali-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="55"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(1, 'bali-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="56"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(2, 'bali-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="57"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(0, 'bali-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="58"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(0, 'latam-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="59"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(1, 'latam-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="60"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(2, 'latam-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="61"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(0, 'latam-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="62"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(5, 'gg2024-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="63"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(22, 'gg2024-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="64"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(38, 'gg2024-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="65"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(0, 'gg2024-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="66"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(0, 'africa-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="67"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(31, 'africa-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="68"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(52, 'africa-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="69"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(0, 'africa-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="70"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(0, 'gg2025-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="71"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(1, 'gg2025-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="72"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(2, 'gg2025-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="73"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(0, 'gg2025-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="74"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(5, 'americas-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="75"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(22, 'americas-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="76"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(37, 'americas-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="77"]').addEventListener('click', function(event) {
  var result = (function(event) { openGallery(0, 'americas-gallery-data') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="78"]').addEventListener('click', function(event) {
  var result = (function(event) { openResource('airport-meditation') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-keydown="79"]').addEventListener('keydown', function(event) {
  var result = (function(event) { if(event.key==='Enter'||event.key===' '){event.preventDefault();openResource('airport-meditation')} }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="80"]').addEventListener('click', function(event) {
  var result = (function(event) { openResource('breathing-corner') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-keydown="81"]').addEventListener('keydown', function(event) {
  var result = (function(event) { if(event.key==='Enter'||event.key===' '){event.preventDefault();openResource('breathing-corner')} }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="82"]').addEventListener('click', function(event) {
  var result = (function(event) { openResource('inviting-the-bell') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-keydown="83"]').addEventListener('keydown', function(event) {
  var result = (function(event) { if(event.key==='Enter'||event.key===' '){event.preventDefault();openResource('inviting-the-bell')} }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="84"]').addEventListener('click', function(event) {
  var result = (function(event) { openResource('mindful-eating') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-keydown="85"]').addEventListener('keydown', function(event) {
  var result = (function(event) { if(event.key==='Enter'||event.key===' '){event.preventDefault();openResource('mindful-eating')} }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="86"]').addEventListener('click', function(event) {
  var result = (function(event) { openResource('five-mindfulness-trainings') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-keydown="87"]').addEventListener('keydown', function(event) {
  var result = (function(event) { if(event.key==='Enter'||event.key===' '){event.preventDefault();openResource('five-mindfulness-trainings')} }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="88"]').addEventListener('click', function(event) {
  var result = (function(event) { openResource('fourteen-mindfulness-trainings') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-keydown="89"]').addEventListener('keydown', function(event) {
  var result = (function(event) { if(event.key==='Enter'||event.key===' '){event.preventDefault();openResource('fourteen-mindfulness-trainings')} }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="90"]').addEventListener('click', function(event) {
  var result = (function(event) { openResource('beginning-anew') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-keydown="91"]').addEventListener('keydown', function(event) {
  var result = (function(event) { if(event.key==='Enter'||event.key===' '){event.preventDefault();openResource('beginning-anew')} }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="92"]').addEventListener('click', function(event) {
  var result = (function(event) { openResource('contemplations-before-eating') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-keydown="93"]').addEventListener('keydown', function(event) {
  var result = (function(event) { if(event.key==='Enter'||event.key===' '){event.preventDefault();openResource('contemplations-before-eating')} }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="94"]').addEventListener('click', function(event) {
  var result = (function(event) { openResource('gathering-tea') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-keydown="95"]').addEventListener('keydown', function(event) {
  var result = (function(event) { if(event.key==='Enter'||event.key===' '){event.preventDefault();openResource('gathering-tea')} }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="96"]').addEventListener('click', function(event) {
  var result = (function(event) { openResource('gathering-walk') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-keydown="97"]').addEventListener('keydown', function(event) {
  var result = (function(event) { if(event.key==='Enter'||event.key===' '){event.preventDefault();openResource('gathering-walk')} }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="98"]').addEventListener('click', function(event) {
  var result = (function(event) { openResource('gathering-hike') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-keydown="99"]').addEventListener('keydown', function(event) {
  var result = (function(event) { if(event.key==='Enter'||event.key===' '){event.preventDefault();openResource('gathering-hike')} }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="100"]').addEventListener('click', function(event) {
  var result = (function(event) { openResource('gathering-forest') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-keydown="101"]').addEventListener('keydown', function(event) {
  var result = (function(event) { if(event.key==='Enter'||event.key===' '){event.preventDefault();openResource('gathering-forest')} }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="102"]').addEventListener('click', function(event) {
  var result = (function(event) { openResource('gathering-meal') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-keydown="103"]').addEventListener('keydown', function(event) {
  var result = (function(event) { if(event.key==='Enter'||event.key===' '){event.preventDefault();openResource('gathering-meal')} }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="104"]').addEventListener('click', function(event) {
  var result = (function(event) { openResource('gathering-day') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-keydown="105"]').addEventListener('keydown', function(event) {
  var result = (function(event) { if(event.key==='Enter'||event.key===' '){event.preventDefault();openResource('gathering-day')} }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="106"]').addEventListener('click', function(event) {
  var result = (function(event) { openResource('start-a-sangha') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-keydown="107"]').addEventListener('keydown', function(event) {
  var result = (function(event) { if(event.key==='Enter'||event.key===' '){event.preventDefault();openResource('start-a-sangha')} }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="108"]').addEventListener('click', function(event) {
  var result = (function(event) { openResource('facilitate-a-circle') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-keydown="109"]').addEventListener('keydown', function(event) {
  var result = (function(event) { if(event.key==='Enter'||event.key===' '){event.preventDefault();openResource('facilitate-a-circle')} }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="110"]').addEventListener('click', function(event) {
  var result = (function(event) { openResource('songs-and-chants') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-keydown="111"]').addEventListener('keydown', function(event) {
  var result = (function(event) { if(event.key==='Enter'||event.key===' '){event.preventDefault();openResource('songs-and-chants')} }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="112"]').addEventListener('click', function(event) {
  var result = (function(event) { if(event.target===this)closeResource() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="113"]').addEventListener('click', function(event) {
  var result = (function(event) { closeResource() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="114"]').addEventListener('click', function(event) {
  var result = (function(event) { document.getElementById('ev-section-calls').scrollIntoView({behavior:'smooth',block:'start'}) }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="115"]').addEventListener('click', function(event) {
  var result = (function(event) { document.getElementById('ev-section-climate').scrollIntoView({behavior:'smooth',block:'start'}) }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="116"]').addEventListener('click', function(event) {
  var result = (function(event) { openProposeClimate() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="117"]').addEventListener('click', function(event) {
  var result = (function(event) { openPropose() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="118"]').addEventListener('click', function(event) {
  var result = (function(event) { if(event.target===this)closePropose() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="119"]').addEventListener('click', function(event) {
  var result = (function(event) { toggleFormType(this) }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="120"]').addEventListener('click', function(event) {
  var result = (function(event) { toggleFormType(this) }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="121"]').addEventListener('click', function(event) {
  var result = (function(event) { toggleFormType(this) }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="122"]').addEventListener('click', function(event) {
  var result = (function(event) { submitPropose() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="123"]').addEventListener('click', function(event) {
  var result = (function(event) { if(event.target===this)closeClimatePropose() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="124"]').addEventListener('click', function(event) {
  var result = (function(event) { submitClimatePropose() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="125"]').addEventListener('click', function(event) {
  var result = (function(event) { if(event.target===this)closeGallery() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="126"]').addEventListener('click', function(event) {
  var result = (function(event) { closeGallery() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="127"]').addEventListener('click', function(event) {
  var result = (function(event) { galleryNav(-1) }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="128"]').addEventListener('click', function(event) {
  var result = (function(event) { galleryNav(1) }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="129"]').addEventListener('click', function(event) {
  var result = (function(event) { dirTab('members') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="130"]').addEventListener('click', function(event) {
  var result = (function(event) { dirTab('offerings') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="131"]').addEventListener('click', function(event) {
  var result = (function(event) { openOfferModal() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="132"]').addEventListener('click', function(event) {
  var result = (function(event) { openForumProposeModal() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="133"]').addEventListener('click', function(event) {
  var result = (function(event) { forumShowView('list') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="134"]').addEventListener('click', function(event) {
  var result = (function(event) { openForumPostModal() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="135"]').addEventListener('click', function(event) {
  var result = (function(event) { joinFromPostsView() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="136"]').addEventListener('click', function(event) {
  var result = (function(event) { forumShowView('list') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="137"]').addEventListener('click', function(event) {
  var result = (function(event) { forumShowView('posts') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="138"]').addEventListener('click', function(event) {
  var result = (function(event) { forumShowView('posts') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="139"]').addEventListener('click', function(event) {
  var result = (function(event) { submitForumReply() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="140"]').addEventListener('click', function(event) {
  var result = (function(event) { if(event.target===this)closeForumPostModal() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="141"]').addEventListener('click', function(event) {
  var result = (function(event) { closeForumPostModal() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="142"]').addEventListener('click', function(event) {
  var result = (function(event) { submitForumPost() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="143"]').addEventListener('click', function(event) {
  var result = (function(event) { if(event.target===this)closeForumProposeModal() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="144"]').addEventListener('click', function(event) {
  var result = (function(event) { closeForumProposeModal() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="145"]').addEventListener('click', function(event) {
  var result = (function(event) { submitForumPropose() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="146"]').addEventListener('click', function(event) {
  var result = (function(event) { if(event.target===this)closeOfferModal() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="147"]').addEventListener('click', function(event) {
  var result = (function(event) { closeOfferModal() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="148"]').addEventListener('click', function(event) {
  var result = (function(event) { selectOfferFormat('remote') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="149"]').addEventListener('click', function(event) {
  var result = (function(event) { selectOfferFormat('inperson') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="150"]').addEventListener('click', function(event) {
  var result = (function(event) { selectOfferFormat('both') }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});
document.querySelector('[data-bind-click="151"]').addEventListener('click', function(event) {
  var result = (function(event) { submitOffer() }).call(this, event);
  if (result === false) { event.preventDefault(); event.stopPropagation(); }
});

// Custom card controls retain their layout and support keyboard activation.
document.querySelectorAll('.tl-item, .ph-cell, .offer-fee-opt').forEach(function(control) {
  control.addEventListener('keydown', function(event) {
    if (event.target === control && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault(); control.click();
    }
  });
});
