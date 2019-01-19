---
title: "Redis - The Beginning"
excerpt: "Redis, what is it and when it can be used"
header:
  teaser: "/assets/images/redis-logo.png"
tags: 
  - redis
---

For quite some time I was looking for an opportunity to start my own blog. I have decided that there is no better time than now, while I have just started my new journey at [Redis Labs](https://redislabs.com/).

In my first post, of course, I will discuss about [Redis](https://redis.io), for those (few) who do not know what is Redis, here are the highlights


### What is Redis

Redis is an open source (BSD) in-memory NoSQL database. This means you can easily store and read your application data, but more important is that you get **High Performance** (and I mean it, it’s **fast**) 

Has built-in developer friendly and intuitive data types, to help and tackle many of your applications use cases. This is what I think makes Redis really fun and super easy to work with, and probably one of the main reasons it became so popular.

Maybe the coolest thing about Redis, it is that it is extendable. This is implemented in what is called Redis modules, and the idea behind it is to adapt your database to your data. There are modules for Search, JSON, ML and much more.

<figure>
    <a href="/assets/images/redis-logo.png"><img src="/assets/images/redis-logo.png"></a>
</figure>

### What Can I Do With Redis

The easiest way to understand what is Redis, and what it is good for, let's see some of the use cases where Redis really shines.

Well, the most obvious use case is of course caching, you can use Redis for session caching, web page cache and of course cache your database queries and boost your application performance making it blazing fast.

<figure>
    <a href="/assets/images/cache-diagram.png"><img src="/assets/images/cache-diagram.png"></a>
</figure>

Another common use case comes from the gaming industry, in implementing a leaderboard. In every game that we play on our phones, there is almost always an implementation of a leaderboard. 

We want to know who is the king of the hill, and of course what is our current position, and we want it in real time!

<figure>
    <a href="/assets/images/leaderboard.png"><img src="/assets/images/leaderboard.png"></a>
</figure>

If you think about the implementation you would come to realize that this is not such an easy task. We need to store our user's scores simultaneously, and have the board always up to date and sorted. The last piece of this puzzle is, of course, we would like it to be **F-A-S-T!!!**

In Redis this is dead simple just use a SortedSet and you are done, simple as that.



You can do a lot more cool stuff with Redis, such as job management by using in-memory queues, messaging, analytics, Geo searches and more.

Now that we understand what is Redis all about, in the next post I will show you how to start baking using Redis as to cache user queries.

