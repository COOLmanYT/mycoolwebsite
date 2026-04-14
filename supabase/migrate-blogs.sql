-- ============================================================
-- Supabase Blog Migration
-- Run this in the Supabase SQL editor AFTER running blogs.sql
-- to seed the three existing blog posts into the blogs table.
-- ============================================================

-- Post 1: Building my Website using GPT-5 Codex
INSERT INTO blogs (slug, title, content_markdown, published, created_at, updated_at)
VALUES (
  'building-my-website-using-gpt5-codex',
  'Building my Website using GPT-5 Codex (and some brains)',
  $md$It took several months of "hard" work, but I made it. I have officially finished coding my website (for the main part). And now, here is my journey for you.

## My First Commit
The first commit began when I saw my friend with his awesome and cool website. It was also directly connected to his discord as well, and I loved the animation when hovering over a button. I started learning some basic HTML and CSS, and made a very, *very* basic website consisting of just 1 page asking you to subscribe. 

## My First Pull Request
I left the website for a bit, then I came back after learning some more code. My first pull request was actually just trying to make the button using HTML instead of JS, but all it did was add a href inside of a button. Sounds stupid, right? Because it was.

## Everything In Between
After 50 commits and me getting a 30 day free trial of Copilot Pro, the website started coming along. The nice gradient background was relaxing, the dark/light mode button got rid of the need of a dark mode extension and I got a working interactive nav bar! The blog was barebones and only with placeholders, and the gallery was (and still is) just placeholders that the AI got from some place on the internet.

But I was still in Beta. There were more things that I wanted to add, I wanted to change, I wanted to get rid of. The website looked and felt complete, but I knew there was more to add

## Feature Mania
I wanted a contact form, so I used Formspree to hold the backend. I wanted comments on my blog, I used Commento to hold the backend for that. I wanted social link buttons to expand and say what platform they are from... that kinda broke my website for a bit. Slowly, the additions got more crazy. Then came...

## The Biggest Pull Request
I had an idea in my head. There were times where I wanted to update my website, but I didn't have my laptop with me. I didn't trust a Copilot that I can't pick the model of, so I had a bold idea.

> I should make **an admin panel**

And so began the grueling task of making one. And a secure one it had to be. I needed to make sure it was only me and my approved members who could access the page, so I thought on how to control that. Aha! Github API! I could connect the website to a GitHub App that does OAuth and verifies my account so I can access the website. Github was also the best option here, as my website code is stored on Github. I was considering Google, Microsoft, etc., but it seemed too complicated. So with Github I went.

I also wanted to incorporate RSS into my website as well as a Discord webhook for my discord server (that I'm going to announce in my next YouTube video officially) to ping everyone when I have a new blog post. I mean, I could make a YouTube video instead, but with the admin panel, I could just post without having to make a YouTube video and go through editing and all that *boring* crap.

After a few hours of coding (and asking ChatGPT to code for me), I had done it. I had implemented everything I wanted, along with a countdown to a release. And **I had done it. I had finished my website** (mostly). I went ahead and created a branch, converted it into a pull request, and added it to main. 

My website still had a few issues, but they were resolved later.

## What Now?
I won't give up on this website. There will be things I want to add and some of those are impossible on this static website. Maybe one day, I'll change this website from Vercel to another. Maybe I'll buy the domain coolmanyt.com to make it official. (spoiler: I did) Who knows? But right now, it's just going to get better from here.$md$,
  true,
  '2025-12-18T00:00:00Z',
  '2026-01-13T00:00:00Z'
)
ON CONFLICT (slug) DO UPDATE SET
  title            = EXCLUDED.title,
  content_markdown = EXCLUDED.content_markdown,
  published        = EXCLUDED.published,
  updated_at       = EXCLUDED.updated_at;

-- Post 2: Social Media Ban
INSERT INTO blogs (slug, title, content_markdown, published, created_at, updated_at)
VALUES (
  'social-media-ban',
  'Social Media Ban',
  $md$The Australian Government has made a very catastrophic mistake by banning social media for Australians under 16. In this blog, I talk about why this is such a catastrophic mistake and why the government needs to rethink ASAP.

For those who do not know, the Australian government created a bill that **bans social media platforms from letting children under 16 create or have a social media account**. Most Australians know about the proposal by now.

As all of us can clearly see, this is a recipe for catastrophe. We use these platforms **every day** to communicate with not only our friends but also our family, and they are one of the main ways we learn what is going on in the world.

**Multiple** people, groups, communities, and even companies have tried calling this out but to *no avail*. The children of Australia deserve freedom of speech, though I do have to say that social media has **gone out of hand for kids.**

## Why This Is a Catastrophic Mistake

This ban will lead to several negative consequences for young Australians, including:

- **Social Isolation:** We use social media to talk to our friends and family, to catch up, and to arrange hanging out at the nearest shopping center. Blocking us from doing this will ruin relationships and make it extremely hard to communicate.
- **Educational Disadvantages:** Social media is often used for educational purposes, including group projects and learning about news. This ban could hinder our ability to access resources that we **need** for school. **And because YouTube is on this list, the amount of educational resources will be incredibly limited for students like me.**
- **Mental Health Impacts:** While social media can have negative effects, it also provides support networks for lots of us. Removing access could cause severe mental health issues. We will talk more about this later.
- **Digital Literacy:** In today's world, digital skills are essential. Banning social media could limit opportunities for us to develop these skills.

But I do not think this ban is a good idea—it needs a rethink.

## My Idea

Instead of having this ban for under 16s, the target age should change to under 13s. According to the [eSafety](https://www.esafety.gov.au/newsroom/media-releases/esafety-report-shows-widespread-underage-use-of-social-media-and-minimal-measures-to-prevent-kids-signing-up), a solid **80% of Australians aged 8–12 have a social media account,** despite minimum ages being 13 due to COPPA's data collection regulations.

Changing the age to under-13s will not affect as many people, and children that young should not have social media at that age anyway. They could talk to their friends using an alternative such as Messenger Kids or just spend time together in real life.

But for teenagers 13–16, they should be allowed to use social media as they are more mature and can handle the responsibilities that come with it. Plus, they need social media to communicate with their friends and family, and banning them from it will only lead to more problems.

## The Side We Ignore

While this ban should be for under 13s, there are some things we need to be aware of or we are **going** to develop mental health issues.

- **Cyberbullying:** Social media can be a breeding ground for cyberbullying, which can have severe mental health impacts. We need to be aware of this and take steps to protect ourselves. According to [eSafety](https://www.esafety.gov.au/key-topics/cyberbullying), 44% of young people experienced cyberbullying within the last six months alone, including 15% receiving threats or abuse online (2021).
- **Addiction:** Social media can be addictive, and we need to be aware of the signs of addiction and take steps to limit our use.
- **Privacy Concerns:** We need to be aware of the privacy concerns associated with social media and take steps to protect our personal information.
- **Letting Parents Guide:** Most social media platforms have parental control settings to protect us online, but some parents neglect these settings or ignore them because "oh my child is a sweetie." We need to make sure parents can guide children to be safe online. If they do that, then we do not even need this ban in the first place!
- **Online "PDFs":** If you do not know what a PDF is (not the file format), it is someone above 18 who does incredibly questionable things to children. Social media can also be the best place for these people to lurk around, especially places like Roblox.
- **Screen Time:** We do use a lot of screen time. According to the [Australian Institute of Family Studies](https://aifs.gov.au/research/commissioned-reports/childrens-screen-time), for 12–13 year olds, more than three hours on average per weekday and almost four hours per weekend day are spent on screens. This means that up to 30% of a child's waking time is spent in front of a screen. We need to be very careful about the time we spend online.

## Conclusion

In conclusion, while the intention behind the social media ban for under 16s may be to protect young Australians, it is a catastrophic mistake that could lead to social isolation, educational disadvantages, mental health impacts, and limited digital literacy. Instead, the government should consider changing the target age to under 13s, while also addressing the issues of cyberbullying, addiction, privacy concerns, parental guidance, online predators, and screen time. By taking these steps, we can ensure that young Australians can safely and responsibly use social media to connect with others and access valuable resources.

## But Wait, There Is More

YOU can help change the age limit on social media. There is an online petition you can fill out to help change what happens. Go to the [Australian Parliament House Petitions](https://www.aph.gov.au/e-petitions/petition/EN8494/) page to stop the government taking our rights as the future of Australia.

> Last updated November 8, 2025 2:35PM AEDT$md$,
  true,
  '2025-11-08T00:00:00Z',
  '2025-11-08T00:00:00Z'
)
ON CONFLICT (slug) DO UPDATE SET
  title            = EXCLUDED.title,
  content_markdown = EXCLUDED.content_markdown,
  published        = EXCLUDED.published,
  updated_at       = EXCLUDED.updated_at;

-- Post 3: Balancing School and Builds (draft — published = false)
INSERT INTO blogs (slug, title, content_markdown, published, created_at, updated_at)
VALUES (
  'balancing-school-and-builds',
  'Balancing School and Builds',
  $md$The full article will unpack my weekly sprint board, school assignment tracker, and how I delegate asset polish when finals hit. Bookmark this post or subscribe for the update!$md$,
  false,
  '2025-08-21T00:00:00Z',
  '2025-08-21T00:00:00Z'
)
ON CONFLICT (slug) DO UPDATE SET
  title            = EXCLUDED.title,
  content_markdown = EXCLUDED.content_markdown,
  published        = EXCLUDED.published,
  updated_at       = EXCLUDED.updated_at;
