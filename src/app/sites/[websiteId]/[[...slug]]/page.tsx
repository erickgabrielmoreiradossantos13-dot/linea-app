import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteDocument } from "@/components/site/page-block-renderer";
import { getPublishedPage } from "@/features/editor/public";

function pathFromSlug(slug?: string[]) { return slug?.length ? `/${slug.join("/")}` : "/"; }

type PublishedPageProps = { params: Promise<{ websiteId: string; slug?: string[] }> };

export async function generateMetadata({ params }: PublishedPageProps): Promise<Metadata> {
  const { websiteId, slug } = await params;
  const page = await getPublishedPage(websiteId, pathFromSlug(slug));
  if (!page) return {};
  return { title: page.title, description: page.description, robots: page.indexable ? { index: true, follow: true } : { index: false, follow: false } };
}

export default async function PublishedSitePage({ params }: PublishedPageProps) {
  const { websiteId, slug } = await params;
  const page = await getPublishedPage(websiteId, pathFromSlug(slug));
  if (!page) notFound();
  return <main className="published-site"><SiteDocument blocks={page.blocks}/><footer><span>{page.websiteName}</span><span>Publicado con Línea App</span></footer></main>;
}
