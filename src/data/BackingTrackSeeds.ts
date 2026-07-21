export type VideoPlatform = 'youtube' | 'rutube' | 'vk';

export interface BackingTrackSeed {
  platform: VideoPlatform;
  /** YouTube video id (11 chars) */
  id: string;
  title?: string;
  /** optional metadata for smarter selection */
  key?: string;
  mode?: string;
  bpm?: number;
  tags?: string[];
}

const seedFromYouTubeUrl = (url: string): string | null => {
  try {
    // examples:
    // https://www.youtube.com/watch?v=XXXXXXXXXXX
    // http://www.youtube.com/watch?v=XXXXXXXXXXX
    const m = url.match(/[?&]v=([^&?\s]{11})/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
};

/**
 * Seed-pool for random NEXT generation.
 * Note: at this stage we only reliably know YouTube ids from user-provided links.
 */
export const BACKING_TRACK_SEEDS: BackingTrackSeed[] = [
  'http://www.youtube.com/watch?v=Vq8cApzOdy8',
  'http://www.youtube.com/watch?v=wlgnfOttRoU',
  'http://www.youtube.com/watch?v=K4fsV8ZAL5A',
  'http://www.youtube.com/watch?v=AXg39_kG-Jc',
  'http://www.youtube.com/watch?v=F29t7_uYs1A',
  'http://www.youtube.com/watch?v=a-u6Q4Vzhjg',
  'http://www.youtube.com/watch?v=tSM40GlyFvk',
  'http://www.youtube.com/watch?v=n9c5tcGtuAQ',
  'http://www.youtube.com/watch?v=H6cZfQWgG3o',
  'http://www.youtube.com/watch?v=boRq9wcXt2U',
  'http://www.youtube.com/watch?v=6xd-Hu62GUw',
  'http://www.youtube.com/watch?v=RRuL6f75Hsw',
  'http://www.youtube.com/watch?v=DCCLLFlP21A',
  'http://www.youtube.com/watch?v=siOLKqMEGzQ',
  'http://www.youtube.com/watch?v=arkJ-eHUVcs',
  'http://www.youtube.com/watch?v=taSbUdL75Pw',
  'http://www.youtube.com/watch?v=BNVbWDIT4eo',
  'http://www.youtube.com/watch?v=34JdM1U-ajo',
  'http://www.youtube.com/watch?v=texjZOsOo_c',
  'http://www.youtube.com/watch?v=JttlFZzL814',
  'http://www.youtube.com/watch?v=QT2NpZ8sa1c',
  'http://www.youtube.com/watch?v=1yV7RBzcq9Q',
  'http://www.youtube.com/watch?v=JTugL-r-M74',
  'http://www.youtube.com/watch?v=M3KW0hEhB34',
  'http://www.youtube.com/watch?v=y3DTSp850DU',
  'http://www.youtube.com/watch?v=g43gWTwpf8w',
  'http://www.youtube.com/watch?v=XIFPGMHmxPs',
  'http://www.youtube.com/watch?v=JMCVqNu3N5Y',
  'http://www.youtube.com/watch?v=_1YdWRmNxzY',
  'http://www.youtube.com/watch?v=fd9Z3chB7hY',
  'http://www.youtube.com/watch?v=wKbg6iDSXJQ',
  'http://www.youtube.com/watch?v=cM1DqA8C3E0',
  'http://www.youtube.com/watch?v=fyfrE0gdNpQ',
  'http://www.youtube.com/watch?v=iqPT681GwxA',
  'http://www.youtube.com/watch?v=BqphnGdxZe0',
  'http://www.youtube.com/watch?v=jdX0x5dCGnU',
  'http://www.youtube.com/watch?v=ixHUY3cPRDQ',
  'http://www.youtube.com/watch?v=MrxJ3CUSXqw',
  'http://www.youtube.com/watch?v=ICZS1O6Divg',
  'http://www.youtube.com/watch?v=8THqoSTL4S0',
  'http://www.youtube.com/watch?v=fHJCofxVWcA',
  'http://www.youtube.com/watch?v=Q4V6R60kJzg',
  'http://www.youtube.com/watch?v=Zs_FbNk1xdI',
  'http://www.youtube.com/watch?v=z9-jgJJvArI',
  'http://www.youtube.com/watch?v=BzihFvQM6vo',
  'http://www.youtube.com/watch?v=YBgDUkS_30k',
  'http://www.youtube.com/watch?v=WJbwkz-WFH4',
  'http://www.youtube.com/watch?v=kEIZ1n9Q-rw',
  'http://www.youtube.com/watch?v=gQk5YKp7JZM',
  'http://www.youtube.com/watch?v=Ieu0elFHuv4',
  'http://www.youtube.com/watch?v=rGoYRaHTwGM',
  'http://www.youtube.com/watch?v=6oUYTb03pTo',
  'http://www.youtube.com/watch?v=ki1Z32leUpg',
  'http://www.youtube.com/watch?v=3stpZKNF_jQ',
  'http://www.youtube.com/watch?v=MS8M8J09Dbs',
  'http://www.youtube.com/watch?v=7-nHdCmX2k8',
  'http://www.youtube.com/watch?v=07d0Qr_4xUE',
  'http://www.youtube.com/watch?v=dAEHT71FPO0',
  'http://www.youtube.com/watch?v=C9dFdlYYKaE',
  'http://www.youtube.com/watch?v=wd_uuNTI2m8',
  'http://www.youtube.com/watch?v=c3wUGLaoSWQ',
  'http://www.youtube.com/watch?v=4Zbtz7T-3o0',
  'http://www.youtube.com/watch?v=IBUjsYM1zzg',
  'http://www.youtube.com/watch?v=jTIEKXO9mOI',
  'http://www.youtube.com/watch?v=-ffEoEozwpc',
  'http://www.youtube.com/watch?v=2EoqzNR68pY',
  'http://www.youtube.com/watch?v=HoR-wGfJU08',
  'http://www.youtube.com/watch?v=BCD7gVjRdpc',
  'http://www.youtube.com/watch?v=IHoFUun2OMk',
  'http://www.youtube.com/watch?v=O2noDNfFcRs',
  'http://www.youtube.com/watch?v=pjWmRk65iTU',
  'http://www.youtube.com/watch?v=TISiUAPE0Ig',
  'http://www.youtube.com/watch?v=1cJ0OdjMpJk',
  'http://www.youtube.com/watch?v=GIXpx4te0jk',
  'http://www.youtube.com/watch?v=NGHux5lJBX4',
  'http://www.youtube.com/watch?v=QV5t7sA1Zj8',
  'http://www.youtube.com/watch?v=PAvxOj-HFfg',
  'http://www.youtube.com/watch?v=LXCEqXXvnGo',
  'http://www.youtube.com/watch?v=RIrs2LJT1CM',
  'http://www.youtube.com/watch?v=sTaeDtgJRtE',
  'http://www.youtube.com/watch?v=y3DTSp850DU',
  'http://www.youtube.com/watch?v=MP7wKPsyRYY',
  'http://www.youtube.com/watch?v=5zGPBhPBXY0',
  'http://www.youtube.com/watch?v=jtGIVM3nz8g',
  'http://www.youtube.com/watch?v=QT2NpZ8sa1c',
  'http://www.youtube.com/watch?v=0Yu9sN7E194',
  'http://www.youtube.com/watch?v=ANfCywBSqmo',
  'http://www.youtube.com/watch?v=m-Vr5zkj3Ns',
  'http://www.youtube.com/watch?v=qKSxTuO5Qlk',
  'http://www.youtube.com/watch?v=FR3tRrrdGYE',
  'http://www.youtube.com/watch?v=5yOyVzojzv4',
  'http://www.youtube.com/watch?v=RT5qNoGoXqM',
  'http://www.youtube.com/watch?v=JylAC8eql1w',
  'http://www.youtube.com/watch?v=eCDmHdCvUhE',
  'http://www.youtube.com/watch?v=wzcfA6vC-gA',
  'http://www.youtube.com/watch?v=GWyEe3pqZiQ',
  'http://www.youtube.com/watch?v=KINhP7hEvgc',
  'http://www.youtube.com/watch?v=ucp6d_Q-faI',
  'http://www.youtube.com/watch?v=Y3FVvNUPMuM',
  'http://www.youtube.com/watch?v=gQk5YKp7JZM',
  'http://www.youtube.com/watch?v=FeyulOqzyXw',
  'http://www.youtube.com/watch?v=QJA5shc9bew',
  'http://www.youtube.com/watch?v=2TWrxulpbpo',
  'http://www.youtube.com/watch?v=uFePUOiDHXU',
  'http://www.youtube.com/watch?v=HQxMP-2GrU8',
  'http://www.youtube.com/watch?v=wCBfk8ZCMOU',
  'http://www.youtube.com/watch?v=FTBdimPd-Hg',
  'http://www.youtube.com/watch?v=OmbWAsQaxzA',
  'http://www.youtube.com/watch?v=norE7lWonbw',
  'http://www.youtube.com/watch?v=BjXFYwjZLIM',
  'http://www.youtube.com/watch?v=FM2JIDyozns',
  'http://www.youtube.com/watch?v=JAc3hMtTzyo',
  'http://www.youtube.com/watch?v=RcOFt6UjGnM',
  'http://www.youtube.com/watch?v=zeSoa55GmnE',
  'http://www.youtube.com/watch?v=go2NlmO5pzM',
  'http://www.youtube.com/watch?v=NZht6wLcNTA',
  'http://www.youtube.com/watch?v=VP1Aj4csH58',
  'http://www.youtube.com/watch?v=S_mdCDW1dzg',
  'http://www.youtube.com/watch?v=MpIoQe4pzHk',
  'http://www.youtube.com/watch?v=4Zlkx0o--Io',
  'http://www.youtube.com/watch?v=RrvAvqZVpgo',
  'http://www.youtube.com/watch?v=ASQbebYIImY',
  'http://www.youtube.com/watch?v=X3k1XJSZR8w',
  'http://www.youtube.com/watch?v=flOtLyn-LfA',
  'http://www.youtube.com/watch?v=2KSG2zITNN4',
  'http://www.youtube.com/watch?v=rQdEfvenheQ',
  'http://www.youtube.com/watch?v=ERKrDlL6lws',
  'http://www.youtube.com/watch?v=iafm_TxYzfs',
  'http://www.youtube.com/watch?v=3RHdeXT-Tbo',
  'http://www.youtube.com/watch?v=gw0dVIUIwWI',
  'http://www.youtube.com/watch?v=3l_KEk2b708',
  'http://www.youtube.com/watch?v=asK9RbEE8xw',
  'http://www.youtube.com/watch?v=MsQVAhwc1nc',
  'http://www.youtube.com/watch?v=NutBKO7G2z8',
  'http://www.youtube.com/watch?v=7p3y7MTJX3A',
  'http://www.youtube.com/watch?v=qHej0AIUmAs',
  'http://www.youtube.com/watch?v=tzZjXxIuj6Q',
  'http://www.youtube.com/watch?v=PrL6o8V0TUQ',
  'http://www.youtube.com/watch?v=mEQKPAvXZRI',
  'http://www.youtube.com/watch?v=dQ4TPvP5lv0',
  'http://www.youtube.com/watch?v=7Y6r94v-0eg',
  'http://www.youtube.com/playlist?list=PLbH2-xzj5QWB96GjB3ivr3WulRFjw5jKI'
]
  .map((url) => {
    const id = seedFromYouTubeUrl(url);
    if (!id) return null;
    return { platform: 'youtube' as const, id };
  })
  .filter(Boolean) as BackingTrackSeed[];

