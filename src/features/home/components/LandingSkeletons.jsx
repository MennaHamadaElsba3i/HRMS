const Bar = ({ className = "", dark = false }) => (
  <div className={`rounded ${dark ? "bg-white/15" : "bg-slate-200"} ${className}`} />
);

export const HeroSkeleton = () => (
  <section className="relative overflow-hidden bg-[#243B53] pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-28">
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid animate-pulse items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-5">
          <Bar dark className="mx-auto h-7 w-56 rounded-full lg:mx-0" />
          <Bar dark className="h-12 w-4/5" />
          <Bar dark className="h-12 w-3/5" />
          <div className="space-y-2 pt-2">
            <Bar dark className="h-4 w-full" />
            <Bar dark className="h-4 w-11/12" />
            <Bar dark className="h-4 w-2/3" />
          </div>
          <div className="flex flex-col gap-4 pt-2 sm:flex-row">
            <Bar dark className="h-12 w-full rounded-lg sm:w-40" />
            <Bar dark className="h-12 w-full rounded-lg sm:w-40" />
          </div>
          <Bar dark className="h-9 w-64 rounded-full" />
        </div>
        <div className="mx-auto h-[420px] w-full max-w-[500px] rounded-2xl bg-white/10 lg:max-w-none" />
      </div>
    </div>
  </section>
);

export const AboutSkeleton = () => (
  <>
    <div className="h-[52px] w-full animate-pulse border-y border-white/10 bg-[#486581]" />
    <section className="bg-[#F5F7F8] py-20 sm:py-24">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid animate-pulse items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-4">
            <Bar className="h-4 w-32" />
            <Bar className="h-10 w-3/4" />
            <Bar className="h-4 w-full" />
            <Bar className="h-4 w-4/5" />
            <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl border border-[#D9E2EC] bg-white p-4">
                  <Bar className="h-5 w-20" />
                  <Bar className="mt-3 h-3 w-full" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-[#D9E2EC] bg-white p-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 border-b border-[#EAEDF1] py-5 last:border-0">
                <Bar className="h-10 w-10 rounded-lg" />
                <Bar className="h-4 flex-1" />
                <Bar className="h-8 w-8 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  </>
);

export const FeaturesSkeleton = () => (
  <section className="bg-[#F5F7F8] px-5 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
    <div className="mx-auto w-full max-w-7xl animate-pulse">
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        <Bar className="mx-auto h-8 w-44 rounded-full" />
        <Bar className="mx-auto h-10 w-3/4" />
        <Bar className="mx-auto h-4 w-1/2" />
      </div>
      <div className="mt-14 flex justify-center">
        <div className="min-h-[340px] w-full max-w-[600px] rounded-3xl border border-[#D9E2EC] bg-white p-9">
          <div className="flex items-center gap-4">
            <Bar className="h-14 w-14 rounded-full" />
            <div className="space-y-2">
              <Bar className="h-5 w-48" />
              <Bar className="h-3 w-28" />
            </div>
          </div>
          <Bar className="mt-8 h-4 w-full" />
          <Bar className="mt-3 h-4 w-5/6" />
        </div>
      </div>
    </div>
  </section>
);

export const RolesSkeleton = () => (
  <section className="bg-white px-5 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
    <div className="mx-auto w-full max-w-7xl animate-pulse">
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        <Bar className="mx-auto h-8 w-40 rounded-full" />
        <Bar className="mx-auto h-10 w-3/4" />
        <Bar className="mx-auto h-4 w-1/2" />
      </div>
      <div className="mx-auto mt-12 grid max-w-5xl grid-cols-3 gap-6 border-b border-[#D9E2EC] pb-6">
        {[1, 2, 3].map((i) => <Bar key={i} className="mx-auto h-5 w-24" />)}
      </div>
      <div className="mt-12 grid gap-10 rounded-[28px] border border-[#D9E2EC] bg-[#F5F7F8] p-6 sm:p-8 lg:grid-cols-2 lg:p-12">
        <div className="space-y-5">
          <Bar className="h-10 w-40" />
          <Bar className="h-14 w-14 rounded-2xl" />
          <Bar className="h-9 w-3/4" />
          <Bar className="h-4 w-full" />
          <Bar className="h-4 w-5/6" />
          {[1, 2, 3].map((i) => <Bar key={i} className="h-4 w-2/3" />)}
        </div>
        <div className="h-64 rounded-2xl border border-[#D9E2EC] bg-white" />
      </div>
      <div className="mt-10 h-72 rounded-[28px] bg-[#243B53]/90" />
    </div>
  </section>
);

export const PlansSkeleton = () => (
  <section className="bg-[#F5F7F8] py-20 sm:py-24 lg:py-28">
    <div className="mx-auto w-full max-w-7xl animate-pulse px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-4 text-center">
        <Bar className="mx-auto h-8 w-36 rounded-full" />
        <Bar className="mx-auto h-10 w-3/4" />
        <Bar className="mx-auto h-4 w-2/3" />
      </div>
      <div className="mt-16 grid gap-8 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-[24px] border border-[#D9E2EC] bg-white p-8">
            <Bar className="h-7 w-32" />
            <Bar className="mt-3 h-4 w-40" />
            <Bar className="mt-7 h-10 w-36" />
            <Bar className="mt-4 h-4 w-full" />
            <Bar className="mt-2 h-4 w-3/4" />
            <div className="my-6 h-px bg-[#EAEDF1]" />
            {[1, 2, 3, 4].map((j) => <Bar key={j} className="mb-3 h-4 w-5/6" />)}
            <Bar className="mt-8 h-12 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  </section>
);

export const StatsSkeleton = () => (
  <section className="bg-[#102A43]">
    <div className="mx-auto grid w-full max-w-6xl animate-pulse grid-cols-2 gap-6 px-5 py-8 sm:px-6 lg:grid-cols-4 lg:px-8 lg:py-12">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex flex-col items-center gap-3 py-4">
          <Bar dark className="h-9 w-28" />
          <Bar dark className="h-3 w-36" />
        </div>
      ))}
    </div>
  </section>
);

export const CtaSkeleton = () => (
  <section className="hidden bg-[#F5F7F8] py-20 lg:block xl:py-24">
    <div className="mx-auto w-full max-w-6xl px-8 xl:px-10">
      <div className="flex animate-pulse items-center justify-between gap-12 rounded-[24px] bg-[#243B53] px-10 py-12 xl:px-14 xl:py-14">
        <div className="w-full max-w-2xl space-y-4">
          <Bar dark className="h-7 w-56 rounded-full" />
          <Bar dark className="h-10 w-4/5" />
          <Bar dark className="h-4 w-3/5" />
        </div>
        <Bar dark className="h-12 w-48 rounded-xl" />
      </div>
    </div>
  </section>
);

export const FooterSkeleton = () => (
  <footer className="border-t border-[#D9E2EC] bg-[#102A43]">
    <div className="mx-auto grid w-full max-w-7xl animate-pulse gap-10 px-6 py-12 sm:px-8 lg:grid-cols-[1.25fr_2fr] lg:px-10 lg:py-16">
      <div className="space-y-4">
        <Bar dark className="h-10 w-40" />
        <Bar dark className="h-4 w-full max-w-sm" />
        <Bar dark className="h-4 w-2/3" />
      </div>
      <div className="grid grid-cols-3 gap-6 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-3">
            <Bar dark className="h-4 w-20" />
            {[1, 2, 3].map((j) => <Bar key={j} dark className="h-3 w-24" />)}
          </div>
        ))}
      </div>
    </div>
  </footer>
);