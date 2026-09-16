import CustomerGallery from "./customer-gallery";

type PageProps = {
  params: Promise<{
    galleryId: string;
  }>;
};

export default async function GalleryPage({
  params,
}: PageProps) {
  const { galleryId } =
    await params;

  return (
    <CustomerGallery
      galleryId={galleryId}
    />
  );
}