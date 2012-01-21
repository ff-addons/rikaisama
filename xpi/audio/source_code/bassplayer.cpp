#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include "bass.h"
#include <conio.h>

/* Display error messages */
void Error(const char *text)
{
  printf("Error(%d): %s\n", BASS_ErrorGetCode(), text);
  BASS_Free();
  exit(0);
}


/* Print usage information */
void usage(int exit_code, char *msg)
{
  if(strlen(msg) > 0)
  {
    printf("%s\n", msg);
  }

  printf("usage: bassplayer-win [-ver] [-vol n] <file>\n");
  printf("  -ver: Print the version information.\n");
  printf("  -vol: Set the volume. Range [0-100]. Default: 100.\n");

  exit(exit_code);
}


int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow)
{
  int i;
  DWORD chan, act;
  DWORD volume = 100;
  char file[255] = "";
  int argc = 0;
  LPWSTR *argv;
  char cur_arg[255] = "";

  /* Check the correct BASS was loaded */
  if(HIWORD(BASS_GetVersion()) != BASSVERSION)
  {
    usage(1, "Error: An incorrect version of BASS was loaded!");
  }

  argv = CommandLineToArgvW(GetCommandLineW(), &argc);

  if(NULL == argv)
  {
    printf("Error: Could not determine arguments!\n");
    exit(1);
  }

  if(argc > 4)
  {
    usage(1, "Error: Too many arguments!\n");
  }
  else
  {
    for (i = 1; i < argc; i++)
    {
      wcstombs(cur_arg, argv[i], 255); // Convert to char array

      if (strcmp(cur_arg, "-ver") == 0)
      {
        usage(0, "bassplayer-win version 2.2 by Christopher Brochtrup.\n");
      }
      else if(strcmp(cur_arg, "-vol") == 0)
      {
        i++;
        wcstombs(cur_arg, argv[i], 255);
        volume = atoi(cur_arg);
      }
      else
      {
        strncpy(file, cur_arg, 255);
      }
    }
  }

  LocalFree(argv);

  if(strlen(file) == 0)
  {
    usage(1, "Error: No file provided!\n");
  }

  if(!BASS_Init(-1, 44100, 0, 0, NULL))
  {
    Error("Error: Can't initialize device!");
    exit(1);
  }

  chan = BASS_StreamCreateFile(FALSE, file, 0, 0, 0);

  BASS_SetConfig(BASS_CONFIG_GVOL_STREAM, volume*100); /* Global stream volume (0-10000) */

  BASS_ChannelPlay(chan, FALSE);

  /* Wait for file to finish playing */
  while(act = BASS_ChannelIsActive(chan))
  {
    Sleep(50);
  }

  BASS_Free();
}
