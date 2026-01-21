X (formerly Twitter) open-sourced its latest recommendation algorithm on January 20, 2026, fulfilling a promise made by Elon Musk earlier that month. 

techcrunch.com

 This version is fully AI-driven, powered by xAI's Grok model and built on a transformer-based architecture, replacing older manual heuristic rules with end-to-end machine learning. 

socialmediatoday.com +1

 The system runs on xAI servers and customizes feed recommendations based on individual user preferences, predicting engagements like likes, replies, retweets, and dwell time (how long users spend on a post). 

venturebeat.com

 X has committed to updating the GitHub repository every four weeks with code changes and developer notes for transparency. 

typefully.com +1

The "For You" feed is now split into two main components:Thunder: Focuses on in-network posts from people you follow or interact with regularly.
Phoenix: Handles out-of-network recommendations, pushing content to new audiences and enabling virality by predicting broad appeal. 

@DeFi_Blub

The algorithm processes posts through several stages: candidate generation from multiple sources (e.g., your network, communities, trends), feature hydration (analyzing ~6,000 signals like user interests, post metadata, and real-time engagement), scoring via ML models, filtering (24 stages to remove spam, NSFW, or low-quality content), and final mixing with ads or other elements. 

@tetsuoai

 Weights for signals are dynamic, learned from ML training, and adjusted via A/B testing rather than fixed percentages. 

@tetsuoai

 Negative actions (e.g., blocks, mutes, reports) heavily penalize reach, while positive predictions boost it. 

@nartmadi

What Goes Viral on XVirality is driven by the algorithm's focus on predicted user engagement and personalization, not just raw follower count—even zero-follower accounts can explode if the content resonates. 

 The system rewards posts that generate quick, genuine interactions in the first 15-30 minutes, as this triggers wider distribution via Phoenix. 

@mr_vibe_it

 High dwell time (e.g., from videos, images, or long-form threads) is crucial, as it signals value and keeps users on the platform. 

Key factors that boost virality, based on the open-sourced code and observed patterns:Factor
Description
Impact
Replies
Highest-weighted engagement; sparks discussions and multiplies reach. Polarizing or question-ending posts excel here.
Massive boost—replies are 75x more valuable than likes in some analyses. 

Quotes & Retweets
Extend content to new networks; quotes add endorsement value.
High weight, more than plain retweets. 

Dwell Time & Completion
Time spent reading/viewing; favors succinct yet informative content, media, and threads people finish and share.
Core metric—videos and graphics dominate for this reason. 

Bookmarks & Shares
Underrated signals of value; DM shares especially amplify reach.
50x multiplier in some cases; prioritizes save-worthy content. 

Profile Clicks & Follows
Clicks to check your account (e.g., from surprising low-follower virals) or new follows after viewing.
Major algorithmic push—encourages curiosity-driven hooks. 

Timing & Freshness
Post when audience is active; tie to trends or events for recency boost.
Early momentum within hours is key; old content ages out fast. 

typefully.com +1

Niche Relevance
Stay in your lane; matches user interests via clusters and embeddings.
Amplifies within communities; off-topic posts get filtered. 

What kills virality: Over-posting (limit to 3-4/day to avoid diversity penalties), engagement bait/rage bait, external links (penalizes off-platform traffic), repetition, and negative feedback. 

 Focus on high-value, discussion-sparking content like informative threads, memes on trends, or polarizing takes that encourage replies without toxicity. 

 The algorithm learns from real behaviors, so experiment with genuine, audience-resonant posts for the best results.

