/**
 * Utility functions for generating placeholder images
 */

export class ImageUtils {
  /**
   * Generate a placeholder image URL based on course title and theme
   * @param title Course title
   * @param theme Course theme/category
   * @param width Image width (default: 400)
   * @param height Image height (default: 150)
   * @returns Placeholder image URL
   */
  static generatePlaceholderImage(title: string, theme: string, width: number = 400, height: number = 150): string {
    // Clean the title and theme for use in URL
    const cleanTitle = encodeURIComponent(title.substring(0, 30));
    const cleanTheme = encodeURIComponent(theme);
    
    // Map themes to colors
    const themeColors: { [key: string]: string } = {
      'Safety': 'red',
      'Leadership': 'blue',
      'Compliance': 'green',
      'Soft Skills': 'purple',
      'Technical': 'orange',
      'default': 'gray'
    };
    
    const color = themeColors[theme] || themeColors['default'];
    
    // Generate placeholder URL
    return `https://placehold.co/${width}x${height}/${color}/white?text=${cleanTitle}`;
  }
  
  /**
   * Get image URL for a course, generating a placeholder if needed
   * @param course Course object
   * @returns Image URL
   */
  static getCourseImageUrl(course: any): string {
    // If course already has a valid image URL, use it
    if (course.imagem_capa_url && (course.imagem_capa_url.startsWith('http') || course.imagem_capa_url.startsWith('assets/'))) {
      return course.imagem_capa_url;
    }
    
    // Generate a placeholder image
    return this.generatePlaceholderImage(course.titulo, course.categoria);
  }
}