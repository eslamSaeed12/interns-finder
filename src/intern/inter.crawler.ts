import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import * as puppeteer from 'puppeteer';
import cherio from 'cheerio';
import { Logger } from '@nestjs/common';
import { Intern, InternMode } from './intern.schema';
import { InternService } from './intern.service';

export interface ICrawlerPayload {
  from: 'Wuzzuf' | 'Linkedin' | 'Indeed' | 'Tanqeeb';
}

@Processor('Crawler')
export class InternCrawler {
  constructor(private readonly internService: InternService) {}

  @Process()
  async crawl(job: Job<ICrawlerPayload>) {
    const browser = await puppeteer.launch({ timeout: 0, headless: 'new' });

    let scrabed: Partial<Intern>[] = [];

    try {
      switch (job.data.from) {
        case 'Indeed':
          scrabed = await this.IndeedCrawler(browser);
          break;
        case 'Linkedin':
          scrabed = await this.LinkedinCrawler(browser);
          break;
        case 'Wuzzuf':
          scrabed = await this.wuzzufCrawler(browser);
          break;
        case 'Tanqeeb':
          scrabed = await this.tanqeebCrawler(browser);
          break;
      }

      Logger.log('successfully scrabed and saved from '.concat(job.data.from));

      await browser.close();

      const errors = await this.internService.Validate(scrabed);

      if (errors.length) {
        Logger.log(errors);
        throw new Error(
          'validation Error on Crawling'.concat(' ', ':', job.data.from),
        );
      }

      Logger.log('successfully scrabed and saved from '.concat(job.data.from));

      return await this.internService.Save(scrabed);
    } catch (err) {
      await browser.close();
      Logger.error(err);
      throw err;
    }
  }

  private async wuzzufCrawler(
    browser: puppeteer.Browser,
  ): Promise<Partial<Intern>[]> {
    const page = await browser.newPage();

    try {
      const url =
        'https://wuzzuf.net/search/jobs/?filters[post_date][0]=within_24_hours&q=intern';

      await page.goto(url, { waitUntil: 'networkidle0', timeout: 0 });

      const html = await page.$eval('html', (e) => e.innerHTML);

      const q = cherio.load(html);

      let jobs = q('.css-1gatmva').get();

      const objects: Partial<any>[] = [];

      for (let i = 0; i < jobs.length; i++) {
        const anchor = q(jobs[i]).find('a.css-o171kl').first();
        const img = q(jobs[i]).find('.css-17095x3').first();
        const company = q(jobs[i]).find('.css-17s97q8').first();
        const address = q(jobs[i]).find('.css-5wys0k').first();
        const mode = q(jobs[i])
          .find('.css-o171kl')
          .get()
          .map((ele) => q(ele).text());
        const date = new Date(Date.now() - 86400000);

        objects.push({
          url: 'https://wuzzuf.net'.concat(anchor.attr('href')),
          title: anchor.text(),
          datePosted: date,
          country: 'EG',
          company: company.text().replaceAll('-', '').trim(),
          location: address.text().trim(),
          mode: InternMode.unkown,
          logo: img.attr('src'),
          fields: mode.map((v) => v.replaceAll(' · ', '')),
          proivder: 'Wuzzuf',
        });
      }

      let PageIndexers = q('.ezfki8j0')
        ?.get()
        ?.map((v) => parseInt(q(v)?.text()?.trim()));

      PageIndexers.splice(0, 1);
      PageIndexers.splice(PageIndexers.length - 1, 1);

      let indexer = 0;

      if (!PageIndexers.length) {
        return objects;
      }

      // lopping over the next pages
      while (indexer < PageIndexers.length) {
        await page.goto(
          'https://wuzzuf.net/search/jobs/?q=intern'.concat(
            '&start=',
            (++indexer).toString(),
          ),
        );

        jobs = q('.css-1gatmva').get();

        for (let i = 0; i < jobs.length; i++) {
          const anchor = q(jobs[i]).find('a.css-o171kl').first();
          const img = q(jobs[i]).find('.css-17095x3').first();
          const company = q(jobs[i]).find('.css-17s97q8').first();
          const address = q(jobs[i]).find('.css-5wys0k').first();
          const mode = q(jobs[i])
            .find('.css-o171kl')
            .get()
            .map((ele) => q(ele).text());
          const date = new Date(Date.now() - 86400000);

          objects.push({
            url: 'https://wuzzuf.net'.concat(anchor.attr('href')),
            title: anchor.text(),
            datePosted: date,
            country: 'EG',
            company: company.text().replaceAll('-', '').trim(),
            location: address.text().trim(),
            mode: InternMode.unkown,
            logo: img.attr('src'),
            fields: mode.map((v) => v.replaceAll(' · ', '')),
            proivder: 'Wuzzuf',
          });
        }
      }
      await page.close();
      return objects;
    } catch (err) {
      await page.close();
      throw err;
    }
  }

  private async tanqeebCrawler(
    browser: puppeteer.Browser,
  ): Promise<Partial<Intern>[]> {
    const page = await browser.newPage();

    try {
      const url =
        'https://egypt.tanqeeb.com/ar/jobs/search?keywords=internship&country=213&state=0&search_period=3&order_by=most_recent&search_in=f&lang=all';

      await page.goto(url, { waitUntil: 'networkidle0', timeout: 0 });

      const html = await page.$eval('html', (e) => e.innerHTML);

      const q = cherio.load(html);

      const objects: Array<Partial<any>> = [];

      const jobsCards = q('#site-content #jobs_list > div.card-list').get();

      for (let i = 0; i < jobsCards.length; i++) {
        const isEmptyCard =
          q(jobsCards[i])
            .find('h5.mb-2.hover-title.fs-16.fs-18-lg')
            ?.first()
            ?.text() === '';

        if (isEmptyCard) {
          continue;
        }

        const object: Partial<any> = {
          title: q(jobsCards[i])
            .find('h5.mb-2.hover-title.fs-16.fs-18-lg')
            .first()
            .text(),
          datePosted: new Date(),
          country: 'EG',
          logo: q(jobsCards[i])
            .find(
              'img.d-block.h-auto.max-w-100px.mx-auto.rounded.w-60px.w-lg-auto.lazyloaded',
            )
            ?.first()
            ?.attr('src'),
          fields: [],
          proivder: 'Tanqeeb',
          mode: InternMode.unkown,
          url: 'https://egypt.tanqeeb.com/'.concat(
            q(jobsCards[i])
              .find(
                '.card-body > a.card-list-item.card-list-item-hover.px-3.px-lg-6.py-6.py-lg-4',
              )
              .first()
              .attr('href'),
          ),
          body: q(jobsCards[i])
            .find('div.mb-4.text-primary-2.h7')
            .first()
            .text(),
        };

        const indicators = q(jobsCards[i])
          .find('p.h10.text-secondary.mb-0 > span')
          .get();

        if (indicators.length == 3) {
          object['company'] = q(indicators[1]).first().text();
          object['location'] = q(indicators[0]).first().text();
        } else {
          object['location'] = q(indicators[0]).first().text();
          object['company'] = 'unkown';
        }

        objects.push(object);
      }

      const pagniators = q('ul.pagination .page-item .page-link').get();

      pagniators.splice(0, 1);
      pagniators.splice(pagniators.length - 1, 1);

      if (pagniators.length < 2) {
        return objects;
      }

      let indexer = 0;
      while (indexer < pagniators.length) {
        await page.goto(url.concat('&page_no=', (indexer + 1).toString()));

        const jobsCards = q('#site-content #jobs_list > div.card-list').get();

        for (let i = 0; i < jobsCards.length; i++) {
          const isEmptyCard =
            q(jobsCards[i])
              .find('h5.mb-2.hover-title.fs-16.fs-18-lg')
              ?.first()
              ?.text() === '';

          if (isEmptyCard) {
            continue;
          }

          const object: Partial<any> = {
            title: q(jobsCards[i])
              .find('h5.mb-2.hover-title.fs-16.fs-18-lg')
              .first()
              .text(),
            datePosted: new Date(),
            country: 'EG',
            logo: q(jobsCards[i])
              .find(
                'img.d-block.h-auto.max-w-100px.mx-auto.rounded.w-60px.w-lg-auto.lazyloaded',
              )
              ?.first()
              ?.attr('src'),
            fields: [],
            proivder: 'Tanqeeb',
            mode: InternMode.unkown,
            url: 'https://egypt.tanqeeb.com/'.concat(
              q(jobsCards[i])
                .find(
                  '.card-body > a.card-list-item.card-list-item-hover.px-3.px-lg-6.py-6.py-lg-4',
                )
                .first()
                .attr('href'),
            ),
            body: q(jobsCards[i])
              .find('div.mb-4.text-primary-2.h7')
              .first()
              .text(),
          };

          const indicators = q(jobsCards[i])
            .find('p.h10.text-secondary.mb-0 > span')
            .get();

          if (indicators.length == 3) {
            object['company'] = q(indicators[1]).first().text();
            object['location'] = q(indicators[0]).first().text();
          } else {
            object['location'] = q(indicators[0]).first().text();
            object['company'] = 'unkown';
          }

          objects.push(object);
        }
        indexer++;
      }
      await page.close();
      return objects;
    } catch (err) {
      await page.close();
      throw err;
    }
  }

  private async IndeedCrawler(
    browser: puppeteer.Browser,
  ): Promise<Partial<Intern>[]> {
    const page = await browser.newPage();

    try {
      const url = 'https://eg.indeed.com/jobs?q=internship&l=Egypt';

      await page.goto(url, { waitUntil: 'networkidle0', timeout: 100000 });

      const html = await page.$eval('html', (e) => e.innerHTML);

      const q = cherio.load(html);

      const objects: Array<Partial<any>> = [];

      const jobsCards = q('.jobsearch-ResultsList > li ').get();

      for (let i = 0; i < jobsCards.length; i++) {
        const isEmptyCard =
          q(jobsCards[i]).find('.jobTitle a span').first().text() === '';

        if (isEmptyCard) {
          continue;
        }

        const object: Partial<any> = {
          title: q(jobsCards[i]).find('.jobTitle a span').first().text(),
          datePosted: new Date(),
          country: 'EG',
          fields: [],
          proivder: 'Indeed',
          mode: InternMode.unkown,
          url: 'https://eg.indeed.com'.concat(
            q(jobsCards[i]).find('.jobTitle a').first().attr('href'),
          ),
          body: q(jobsCards[i])
            .find('.jobCardShelfContainer .job-snippet li')
            .first()
            .text(),
          company: q(jobsCards[i]).find('span.companyName').first().text(),
          location: q(jobsCards[i]).find('div.companyLocation').first().text(),
        };

        objects.push(object);
      }

      const pagniators = q('nav .css-tvvxwd a')
        .get()
        .map((e) => q(e).text());

      pagniators.splice(pagniators.length - 1, 1);

      if (pagniators.length == 1 || pagniators.length == 0) {
        return objects;
      }

      let indexer = 0;
      let indicator = 0;
      while (indexer < pagniators.length) {
        await page.goto(url.concat('&start=', (indicator + 10).toString()));

        const jobsCards = q('#site-content #jobs_list > div.card-list').get();

        for (let i = 0; i < jobsCards.length; i++) {
          const isEmptyCard =
            q(jobsCards[i]).find('.jobTitle a span').first().text() === '';

          if (isEmptyCard) {
            continue;
          }

          const object: Partial<any> = {
            title: q(jobsCards[i]).find('.jobTitle a span').first().text(),
            datePosted: new Date(),
            country: 'EG',
            fields: [],
            proivder: 'Indeed',
            mode: InternMode.unkown,
            url: 'https://eg.indeed.com'.concat(
              q(jobsCards[i]).find('.jobTitle a').first().attr('href'),
            ),
            body: q(jobsCards[i])
              .find('.jobCardShelfContainer .job-snippet li')
              .first()
              .text(),
            company: q(jobsCards[i]).find('span.companyName').first().text(),
            location: q(jobsCards[i])
              .find('div.companyLocation')
              .first()
              .text(),
          };

          objects.push(object);
        }
        indexer++;
        indicator += 10;
      }
      await page.close();
      return objects;
    } catch (err) {
      await page.close();
      throw err;
    }
  }

  private async LinkedinCrawler(
    browser: puppeteer.Browser,
  ): Promise<Partial<Intern>[]> {
    const page = await browser.newPage();

    try {
      const url =
        'https://www.linkedin.com/jobs/search?keywords=Internship&f_TPR=r86400&location=Egypt';

      await page.goto(url, { waitUntil: 'load', timeout: 100000 });

      let isEndVisible = await page.$eval(
        '.see-more-jobs__viewed-all p',
        (el) => el.clientHeight,
      );

      while (!isEndVisible) {
        await page.evaluate(async () => {
          window.scrollTo(0, window.document.body.clientHeight);
        });

        isEndVisible = cherio
          .load(await page.$eval('html', (el) => el.innerHTML))(
            '.see-more-jobs__viewed-all p',
          )
          .first().length;
      }

      const html = await page.$eval('html', (e) => e.innerHTML);

      const q = cherio.load(html);

      const objects: Array<Partial<any>> = [];

      const jobsCards = q('.jobs-search__results-list > li').get();

      for (let i = 0; i < jobsCards.length; i++) {
        const object: Partial<any> = {
          title: q(jobsCards[i])
            .find('.base-search-card--link a.base-card__full-link > span')
            .first()
            .text()
            .replaceAll('\n', '')
            .trim(),
          datePosted: new Date(),
          country: 'EG',
          fields: [],
          proivder: 'Linkedin',
          mode: InternMode.unkown,
          url: q(jobsCards[i])
            .find('.base-search-card--link a.base-card__full-link')
            .first()
            .attr('href'),
          company: q(jobsCards[i])
            .find('h4.base-search-card__subtitle a')
            .first()
            .text()
            .replaceAll('\n', '')
            .trim(),
          location: q(jobsCards[i])
            .find('span.job-search-card__location')
            .first()
            .text()
            .replaceAll('\n', '')
            .trim(),
          logo:
            q(jobsCards[i])
              .find('.search-entity-media > img')
              .first()
              .attr('src') ||
            q(jobsCards[i])
              .find('.search-entity-media > img')
              .first()
              .attr('data-delayed-url'),
        };

        objects.push(object);
      }
      await page.close();
      return objects;
    } catch (err) {
      await page.close();
      throw err;
    }
  }
}
