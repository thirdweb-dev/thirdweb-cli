import { Project } from "./Project";

export interface Builder {
  /**
   * Compiles the project and returns the project object.
   *
   * @param project - The path to the project to compile.
   */
  compile(options: { projectPath: string; name: string }): Promise<{
    project: Project;
    hash: string;
  }>;

  /**
   * Uploads the project to storage.
   *
   * @param project - The project to upload
   * @returns - The hash of the uploaded project.
   */
  upload(project: Project): Promise<string>;
}
